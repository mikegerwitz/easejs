/**
 * Contains interface module
 *
 *  Copyright (C) 2010, 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var util           = require( './util' ),

    MethodWrapperFactory = require( './MethodWrapperFactory' ),
    wrappers             = require( './MethodWrappers' ).standard,

    member_builder = require( './MemberBuilder' )(
        MethodWrapperFactory( wrappers.wrapNew ),
        MethodWrapperFactory( wrappers.wrapOverride ),
        MethodWrapperFactory( wrappers.wrapProxy ),
        require( './MemberBuilderValidator' )()
    ),

    Class        = require( './class' ),
    ClassBuilder = require( './ClassBuilder' );;


/**
 * This module may be invoked in order to provide a more natural looking
 * interface definition
 *
 * Only new interfaces may be created using this method. They cannot be
 * extended. To extend an existing interface, call its extend() method, or use
 * the extend() method of this module.
 *
 * @param  {string|Object}  namedef  optional name or definition
 * @param  {Object=}        def      interface definition if first arg is name
 *
 * @return  {Function|Object}  new interface or staging object
 */
module.exports = function( namedef, def )
{
    var type   = ( typeof namedef ),
        result = null
    ;

    switch ( type )
    {
        // anonymous interface
        case 'object':
            result = createAnonymousInterface.apply( null, arguments );
            break;

        // named class
        case 'string':
            result = createNamedInterface.apply( null, arguments );
            break;

        default:
            // we don't know what to do!
            throw TypeError(
                "Expecting anonymous interface definition or named " +
                    "interface definition"
            );
    }

    return result;
};


/**
 * Creates an interface
 *
 * @return  {Function}  extended interface
 */
module.exports.extend = function()
{
    return extend.apply( this, arguments );
};


/**
 * Determines whether the provided object is an interface created through
 * ease.js
 *
 * @param  {Object}  obj  object to test
 *
 * @return  {boolean}  true if interface (created through ease.js), otherwise
 *                     false
 */
module.exports.isInterface = function( obj )
{
    obj = obj || {};

    return ( obj.prototype instanceof Interface )
        ? true
        : false
    ;
};


/**
 * Default interface implementation
 *
 * @return  {undefined}
 */
function Interface() {}


/**
 * Creates a new anonymous Interface from the given interface definition
 *
 * @param  {Object}  def  interface definition
 *
 * @return  {Function}  new anonymous interface
 */
function createAnonymousInterface( def )
{
    // ensure we have the proper number of arguments (if they passed in
    // too many, it may signify that they don't know what they're doing,
    // and likely they're not getting the result they're looking for)
    if ( arguments.length > 1 )
    {
        throw Error(
            "Expecting one argument for Interface definition; " +
                arguments.length + " given."
        );
    }

    return extend( def );
}


/**
 * Creates a new named interface from the given interface definition
 *
 * @param  {string}  name  interface name
 * @param  {Object}  def   interface definition
 *
 * @return  {Function}  new named interface
 */
function createNamedInterface( name, def )
{
    // if too many arguments were provided, it's likely that they're
    // expecting some result that they're not going to get
    if ( arguments.length > 2 )
    {
        throw Error(
            "Expecting two arguments for definition of named Interface '" +
                name + "'; " + arguments.length + " given."
        );
    }

    // the definition must be an object
    if ( typeof def !== 'object' )
    {
        throw TypeError(
            "Unexpected value for definition of named Interface '" +
                name + "'; object expected"
        );
    }

    // add the name to the definition
    def.__name = name;

    return extend( def );
}


/**
 * Augment an exception with interface name and then throw
 *
 * @param  {string}  iname  interface name or empty string
 * @param  {Error}   e      exception to augment
 */
function _ithrow( iname, e )
{
    // alter the message to include our name
    e.message = "Failed to define interface " +
        ( ( iname ) ? iname : '(anonymous)' ) + ": " + e.message
    ;

    throw e;
}


var extend = ( function( extending )
{
    return function extend()
    {
        // ensure we'll be permitted to instantiate interfaces for the base
        extending = true;

        var a         = arguments,
            an        = a.length,
            props     = ( ( an > 0 ) ? a[ an - 1 ] : 0 ) || {},
            base      = ( ( an > 1 ) ? a[ an - 2 ] : 0 ) || Interface,
            prototype = new base(),
            iname     = '',

            // holds validation state
            vstate = {},

            members = member_builder.initMembers(
                prototype, prototype, prototype
            )
        ;

        // grab the name, if one was provided
        if ( iname = props.__name )
        {
            // we no longer need it
            delete props.__name;
        }

        // sanity check
        inheritCheck( prototype );

        var new_interface = createInterface( iname );

        util.propParse( props, {
            assumeAbstract: true,

            // override default exceptions from parser errors
            _throw: function( e )
            {
                _ithrow( iname, e );
            },

            property: function()
            {
                // should never get to this point because of assumeAbstract
                _ithrow( iname, TypeError( "Unexpected internal error" ) );
            },

            getset: function()
            {
                // should never get to this point because of assumeAbstract
                _ithrow( iname, TypeError( "Unexpected internal error" ) );
            },

            method: function( name, value, is_abstract, keywords )
            {
                // all members must be public
                if ( keywords[ 'protected' ] || keywords[ 'private' ] )
                {
                    _ithrow( iname, TypeError(
                        "Member " + name + " must be public"
                    ) );
                }

                member_builder.buildMethod(
                    members, null, name, value, keywords,
                    null, 0, {}, vstate
                );
            },
        } );

        attachExtend( new_interface );
        attachStringMethod( new_interface, iname );
        attachCompat( new_interface );
        attachInstanceOf( new_interface );

        new_interface.prototype   = prototype;
        new_interface.constructor = new_interface;

        // freeze the interface (preventing additions), if supported
        util.freeze( new_interface );

        // we're done; let's not allow interfaces to be instantiated anymore
        extending = false;

        return new_interface;
    };


    /**
     * Creates a new interface constructor function
     *
     * @param  {string=}  iname  interface name
     *
     * @return  {function()}
     */
    function createInterface( iname )
    {
        return function()
        {
            // allows us to extend the interface without throwing an exception
            // (since the prototype requires an instance)
            if ( !extending )
            {
                // only called if someone tries to create a new instance of an
                // interface
                throw Error(
                    "Interface " + ( ( iname ) ? ( iname + ' ' ) : '' ) +
                        " cannot be instantiated"
                );
            }
        };
    }
} )( false );


/**
 * Assures that the parent object is a valid object to inherit from
 *
 * This method allows inheriting from any object (note that it will likely cause
 * errors if not an interface), but will place restrictions on objects like
 * Classes that do not make sense to inherit from. This will provide a more
 * friendly error, with suggestions on how to resolve the issue, rather than a
 * cryptic error resulting from inheritance problems.
 *
 * This method will throw an exception if there is a violation.
 *
 * @param  {Object}  prototype  prototype to check for inheritance flaws
 *
 * @return  {undefined}
 */
function inheritCheck( prototype )
{
    // if we're inheriting from another interface, then we're good
    if ( !( prototype instanceof Interface ) )
    {
        throw new TypeError( "Interfaces may only extend other interfaces" );
    }
}


/**
 * Attaches extend method to the given function (interface)
 *
 * @param  {Function}  func  function (interface) to attach method to
 *
 * @return  {undefined}
 */
function attachExtend( func )
{
    /**
     * Shorthand for extending interfaces
     *
     * This method can be invoked on the object, rather than having to call
     * Interface.extend( this ).
     *
     * @param  {Object}  props  properties to add to extended interface
     *
     * @return  {Object}  extended interface
     */
    util.defineSecureProp( func, 'extend', function( props )
    {
        return extend( this, props );
    });
}


/**
 * Provides more sane/useful output when interface is converted to a string
 *
 * @param  {Object}   func   interface
 * @param  {string=}  iname  interface name
 *
 * @return  {undefined}
 */
function attachStringMethod( func, iname )
{
    func.toString = ( iname )
        ? function() { return '[object Interface <' + iname + '>]'; }
        : function() { return '[object Interface]'; }
    ;
}


/**
 * Attaches a method to assert whether a given object is compatible with the
 * interface
 *
 * @param  {Function}  iface  interface to attach method to
 *
 * @return  {undefined}
 */
function attachCompat( iface )
{
    util.defineSecureProp( iface, 'isCompatible', function( obj )
    {
        return isCompat( iface, obj );
    } );
}


/**
 * Determines if the given object is compatible with the given interface.
 *
 * An object is compatible if it defines all methods required by the
 * interface, with at least the required number of parameters.
 *
 * Processing time is linear with respect to the number of members of the
 * provided interface.
 *
 * To get the actual reasons in the event of a compatibility failure, use
 * analyzeCompat instead.
 *
 * @param  {Interface}  iface  interface that must be adhered to
 * @param  {Object}     obj    object to check compatibility against
 *
 * @return  {boolean}  true if compatible, otherwise false
 */
function isCompat( iface, obj )
{
    // yes, this processes the entire interface, but it is hopefully small
    // anyway and the process is fast enough that doing otherwise may be
    // micro-optimizing
    return analyzeCompat( iface, obj ).length === 0;
}


/**
 * Analyzes the given object to determine if there exists any compatibility
 * issues with respect to the given interface
 *
 * Will provide an array of the names of incompatible members. A method is
 * incompatible if it is not defined or if it does not define at least the
 * required number of parameters.
 *
 * Processing time is linear with respect to the number of members of the
 * provided interface.
 *
 * @param  {Interface}  iface  interface that must be adhered to
 * @param  {Object}     obj    object to check compatibility against
 *
 * @return  {Array.<Array.<string, string>>}  compatibility reasons
 */
function analyzeCompat( iface, obj )
{
    var missing = [];

    util.propParse( iface.prototype, {
        method: function( name, func, is_abstract, keywords )
        {
            if ( typeof obj[ name ] !== 'function' )
            {
                missing.push( [ name, 'missing' ] );
            }
            else if ( obj[ name ].length < func.__length )
            {
                // missing parameter(s); note that we check __length on the
                // interface method (our internal length) but not on the
                // object (since it may be a vanilla object)
                missing.push( [ name, 'incompatible' ] );
            }
        },
    } );

    return missing;
}


/**
 * Attaches instance check method
 *
 * This method is invoked when checking the type of a class against an
 * interface.
 *
 * @param  {Interface}  iface  interface that must be adhered to
 *
 * @return  {undefined}
 */
function attachInstanceOf( iface )
{
    util.defineSecureProp( iface, '__isInstanceOf', function( type, obj )
    {
        return _isInstanceOf( type, obj );
    } );
}


/**
 * Determine if INSTANCE implements the interface TYPE
 *
 * @param  {Interface}  type      interface to check against
 * @param  {Object}     instance  instance to examine
 *
 * @return  {boolean}  whether TYPE is implemented by INSTANCE
 */
function _isInstanceOf( type, instance )
{
    // we are interested in the class's metadata, not the instance's
    var proto = instance.constructor;

    // if no metadata are available, then our remaining checks cannot be
    // performed
    var meta;
    if ( !instance.__cid || !( meta = ClassBuilder.getMeta( proto ) ) )
    {
        return isCompat( type, instance );
    }

    var implemented = meta.implemented,
        i           = implemented.length;

    // check implemented interfaces et. al. (other systems may make use of
    // this meta-attribute to provide references to types)
    while ( i-- )
    {
        if ( implemented[ i ] === type )
        {
            return true;
        }
    }

    return false;
}

module.exports.isInstanceOf = _isInstanceOf;


/**
 * Contains interface module
 *
 *  Copyright (C) 2010, 2011, 2012, 2013 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 */

var util           = require( __dirname + '/util' ),

    MethodWrapperFactory = require( __dirname + '/MethodWrapperFactory' ),
    wrappers             = require( __dirname + '/MethodWrappers' ).standard,

    member_builder = require( __dirname + '/MemberBuilder' )(
        MethodWrapperFactory( wrappers.wrapNew ),
        MethodWrapperFactory( wrappers.wrapOverride ),
        MethodWrapperFactory( wrappers.wrapProxy ),
        require( __dirname + '/MemberBuilderValidator' )()
    ),

    Class = require( __dirname + '/class' )
;


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


var extend = ( function( extending )
{
    return function extend()
    {
        // ensure we'll be permitted to instantiate interfaces for the base
        extending = true;

        var args      = Array.prototype.slice.call( arguments ),
            props     = args.pop() || {},
            base      = args.pop() || Interface,
            prototype = new base(),
            iname     = '',

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

        try
        {
            util.propParse( props, {
                assumeAbstract: true,

                property: function()
                {
                    // should never get to this point because of assumeAbstract
                    throw TypeError( 'Unexpected internal error' );
                },

                getset: function()
                {
                    // should never get to this point because of assumeAbstract
                    throw TypeError( 'Unexpected internal error' );
                },

                method: function( name, value, is_abstract, keywords )
                {
                    // all members must be public
                    if ( keywords[ 'protected' ] || keywords[ 'private' ] )
                    {
                        throw TypeError(
                            iname + " member " + name + " must be public"
                        );
                    }

                    member_builder.buildMethod(
                        members, null, name, value, keywords
                    );
                },
            } );
        }
        catch ( e )
        {
            // alter the message to include our name
            e.message = "Failed to define interface " +
                ( ( iname ) ? iname : '(anonymous)' ) + ": " + e.message
            ;

            // re-throw
            throw e;
        }

        attachExtend( new_interface );
        attachStringMethod( new_interface, iname );

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


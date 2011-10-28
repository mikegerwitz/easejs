/**
 * Handles building members (properties, methods)
 *
 * This prototype could have easily been refactored into a number of others
 * (e.g. one for each type of member), but that refactoring has been deferred
 * until necessary to ensure ease.js maintains a relatively small footprint.
 * Ultimately, however, such a decision is a micro-optimization and shouldn't
 * harm the design and maintainability of the software.
 *
 *  Copyright (C) 2010 Mike Gerwitz
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
 * @package core
 */

var util       = require( __dirname + '/util' ),
    Warning    = require( __dirname + '/warn' ).Warning,
    visibility = [ 'public', 'protected', 'private' ],

    validate = require( __dirname + '/MemberBuilderValidator' )()
;


/**
 * Responsible for building class members
 */
module.exports = function MemberBuilder( wrap_method, wrap_override )
{
    // permit omitting 'new' keyword
    if ( !( this instanceof module.exports ) )
    {
        return new module.exports( wrap_method, wrap_override );
    }

    this._wrapMethod   = wrap_method;
    this._wrapOverride = wrap_override;

    // XXX: temporarily tightly coupled
    this._validate = validate;
};


// we're throwing everything into the prototype
exports = module.exports.prototype;


/**
 * Initializes member object
 *
 * The member object contains members for each level of visibility (public,
 * protected and private).
 *
 * @param  {Object}  mpublic     default public members
 * @param  {Object}  mprotected  default protected members
 * @param  {Object}  mprivate    default private members
 *
 * @return  {{public: Object, protected: Object, private: Object}}
 */
exports.initMembers = function( mpublic, mprotected, mprivate )
{
    return {
        'public':    mpublic    || {},
        'protected': mprotected || {},
        'private':   mprivate   || {},
    };
};


/**
 * Copies a method to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   property name
 * @param  {*}       value  property value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords

 * @param  {Object=}  instCallback  function to call in order to retrieve
 *                                  object to bind 'this' keyword to
 * @param  {number}   cid           class id
 *
 * @return  {undefined}
 */
exports.buildMethod = function(
    members, meta, name, value, keywords, instCallback, cid, base
)
{
    // TODO: We can improve performance by not scanning each one individually
    // every time this method is called
    var prev_data     = scanMembers( members, name, base ),
        prev          = ( prev_data ) ? prev_data.member : null,
        prev_keywords = ( prev && prev.___$$keywords$$ ),
        dest          = getMemberVisibility( members, keywords, name );
    ;

    // ensure that the declaration is valid (keywords make sense, argument
    // length, etc)
    this._validate.validateMethod(
        name, value, keywords, prev_data, prev_keywords
    );

    // we might be overriding an existing method
    if ( prev )
    {

        // TODO: warning if no super method when override keyword provided
        if ( keywords[ 'override' ] || prev_keywords[ 'abstract' ] )
        {
            // override the method
            dest[ name ] = this._overrideMethod(
                prev, value, instCallback, cid
            );
        }
        else
        {
            // by default, perform method hiding, even if the keyword was not
            // provided (the keyword simply suppresses the warning)
            dest[ name ] = hideMethod( prev, value, instCallback, cid );
        }

    }
    else if ( keywords[ 'abstract' ] )
    {
        // we do not want to wrap abstract methods, since they are not callable
        dest[ name ] = value;
    }
    else
    {
        // we are not overriding the method, so simply copy it over, wrapping it
        // to ensure privileged calls will work properly
        dest[ name ] = this._overrideMethod( null, value, instCallback, cid );
    }

    // store keywords for later reference (needed for pre-ES5 fallback)
    dest[ name ].___$$keywords$$ = keywords;
};


/**
 * Copies a property to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   property name
 * @param  {*}       value  property value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords

 * @param  {Object=}  base  optional base object to scan
 *
 * @return  {undefined}
 */
exports.buildProp = function( members, meta, name, value, keywords, base )
{
    // TODO: We can improve performance by not scanning each one individually
    // every time this method is called
    var prev_data     = scanMembers( members, name, base ),
        prev          = ( prev_data ) ? prev_data.member : null,
        prev_keywords = ( prev ) ? prev[ 1 ] : null;

    this._validate.validateProperty(
        name, value, keywords, prev_data, prev_keywords
    );

    getMemberVisibility( members, keywords, name )[ name ] =
        [ value, keywords ];
};


/**
 * Copies a getter to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * XXX: Combine with buildSetter for performance benefit
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   getter name
 * @param  {*}       value  getter value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @param  {Object=}  base  optional base object to scan
 *
 * @return  {undefined}
 */
exports.buildGetter = function( members, meta, name, value, keywords, base )
{
    validateGetterSetter( members, keywords, name, base );

    Object.defineProperty(
        getMemberVisibility( members, keywords, name ),
        name,
        {
            get:        value,
            enumerable: true,

            // otherwise we can't add a setter to this
            configurable: true,
        }
    );
};


/**
 * Copies a setter to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * XXX: Combine with buildGetter for performance benefit
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   setter name
 * @param  {*}       value  setter value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @param  {Object=}  base  optional base object to scan
 *
 * @return  {undefined}
 */
exports.buildSetter = function( members, meta, name, value, keywords, base )
{
    validateGetterSetter( members, keywords, name, base );

    Object.defineProperty(
        getMemberVisibility( members, keywords, name ),
        name,
        {
            set:        value,
            enumerable: true,

            // otherwise we can't add a getter to this
            configurable: true,
        }
    );
};


/**
 * Performs common validations on getters/setters
 *
 * If a problem is found, an exception will be thrown.
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 * @param  {string}                   name      getter/setter name
 * @param  {Object}                   base      optional base to parse
 */
function validateGetterSetter( members, keywords, name, base )
{
    var prev_data = scanMembers( members, name, base ),
        prev      = ( prev_data ) ? prev_data.member : null,

        prev_keywords = ( prev && prev.___$$keywords$$ )
            ? prev.___$$keywords$$
            : {}
    ;

    if ( prev )
    {
        // To speed up the system we'll simply check for a getter/setter, rather
        // than checking separately for methods/properties. This is at the
        // expense of more detailed error messages. They'll live.
        if ( !( prev_data.get || prev_data.set ) )
        {
            throw TypeError(
                "Cannot override method or property '" + name +
                    "' with getter/setter"
            );
        }
    }
}


/**
 * Returns member prototype to use for the requested visibility
 *
 * Will throw an exception if multiple access modifiers were used.
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 * @param  {string}                   name      member name
 *
 * @return  {Object}  reference to visibility of members argument to use
 */
function getMemberVisibility( members, keywords, name )
{
    var viserr = function()
    {
        throw TypeError(
            "Only one access modifier may be used for definition of '" +
                name + "'"
        );
    }

    // there's cleaner ways of doing this, but consider it loop unrolling for
    // performance
    if ( keywords[ 'private' ] )
    {
        ( keywords[ 'public' ] || keywords[ 'protected' ] ) && viserr();
        return members[ 'private' ];
    }
    else if ( keywords[ 'protected' ] )
    {
        ( keywords[ 'public' ] || keywords[ 'private' ] ) && viserr();
        return members[ 'protected' ];
    }
    else
    {
        // public keyword is the default, so explicitly specifying it is only
        // for clarity
        ( keywords[ 'private' ] || keywords[ 'protected' ] ) && viserr();
        return members[ 'public' ];
    }
}


/**
 * Scan each level of visibility for the requested member
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {string}   name  member to locate
 * @param  {Object=}  base  optional base object to scan
 *
 * @return  {Object}  Array of member and number corresponding to visibility,
 *                    level if located, otherwise an empty object
 */
function scanMembers( members, name, base )
{
    var i      = visibility.length,
        member = null;

    // locate requested member by scanning each level of visibility
    while ( i-- )
    {
        var visobj = members[ visibility[ i ] ];

        // In order to support getters/setters, we must go off of the
        // descriptor. We must also ignore base properties (last argument), such
        // as Object.prototype.toString(). However, we must still traverse the
        // prototype chain.
        if ( member = util.getPropertyDescriptor( visobj, name, true ) )
        {
            return {
                get:        member.get,
                set:        member.set,
                member:     member.value,
            };
        }
    }

    // if a second comparison object was given, try again using it instead of
    // the original members object
    if ( base !== undefined )
    {
        var base_methods = base.___$$methods$$,
            base_props   = base.___$$props$$;

        // scan the base's methods and properties, if they are available
        return ( base_methods && scanMembers( base_methods, name ) )
            || ( base_props && scanMembers( base_props, name ) )
            || null
        ;
    }

    // nothing was found
    return null;
}


/**
 * Hide a method with a "new" method
 */
function hideMethod( super_method, new_method, instCallback, cid )
{
    // TODO: This function is currently unimplemented. It exists at present to
    // provide a placeholder and ensure that the override keyword is required to
    // override a parent method.
    //
    // We should never get to this point if the default validation rule set is
    // used to prevent omission of the 'override' keyword.
    throw Error(
        'Method hiding not yet implemented (we should never get here; bug).'
    );
}


/**
 * Generates a method override function
 *
 * The override function simply wraps the method so that its invocation will
 * pass a __super property. This property may be used to invoke the overridden
 * method.
 *
 * @param  {function()}  super_method      method to override
 * @param  {function()}  new_method        method to override with
 *
 * @param  {Object=}  instCallback  function to call in order to retrieve
 *                                  object to bind 'this' keyword to
 * @param  {number}   cid           class id
 *
 * @return  {function()}  override method
 */
exports._overrideMethod = function(
    super_method, new_method, instCallback, cid
)
{
    instCallback = instCallback || function() {};

    // return a function that permits referencing the super method via the
    // __super property
    var override = null;

    // are we overriding?
    override = (
        ( super_method )
            ? this._wrapOverride
            : this._wrapMethod
        ).wrapMethod( new_method, super_method, cid, instCallback );

    // This is a trick to work around the fact that we cannot set the length
    // property of a function. Instead, we define our own property - __length.
    // This will store the expected number of arguments from the super method.
    // This way, when a method is being overridden, we can check to ensure its
    // compatibility with its super method.
    util.defineSecureProp( override,
        '__length',
        ( new_method.__length || new_method.length )
    );

    return override;
}


/**
 * Return the visibility level as a numeric value, where 0 is public and 2 is
 * private
 *
 * @param  {Object}  keywords  keywords to scan for visibility level
 *
 * @return  {number}  visibility level as a numeric value
 */
exports._getVisibilityValue = function( keywords )
{
    if ( keywords[ 'protected' ] )
    {
        return 1;
    }
    else if ( keywords[ 'private' ] )
    {
        return 2;
    }
    else
    {
        // default is public
        return 0;
    }
}


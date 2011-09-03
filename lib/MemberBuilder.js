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

var util = require( __dirname + '/util' ),

    Warning = require( __dirname + '/warn' ).Warning,

    fallback   = util.definePropertyFallback(),
    visibility = [ 'public', 'protected', 'private' ]
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
        dest          = getMemberVisibility( members, keywords );
    ;

    // ensure that the declaration is valid (keywords make sense, argument
    // length, etc)
    validateMethod( keywords, prev_data, prev_keywords, value, name );

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
 * Validates a method declaration, ensuring that keywords are valid, overrides
 * make sense, etc.
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @param  {Object}  prev_data      data of member being overridden
 * @param  {Object}  prev_keywords  keywords of member being overridden
 * @param  {*}       value          property value
 * @param  {string}  name           property name
 */
function validateMethod( keywords, prev_data, prev_keywords, value, name )
{
    var prev = ( prev_data ) ? prev_data.member : null;

    if ( keywords[ 'abstract' ] )
    {
        // do not permit private abstract methods (doesn't make sense, since
        // they cannot be inherited/overridden)
        if ( keywords[ 'private' ] )
        {
            throw TypeError(
                "Method '" + name + "' cannot be both private and abstract"
            );
        }
    }

    // const doesn't make sense for methods; they're always immutable
    if ( keywords[ 'const' ] )
    {
        throw TypeError(
            "Cannot declare method '" + name + "' as constant; keyword is " +
            "redundant"
        );
    }

    // virtual static does not make sense, as static methods cannot be
    // overridden
    if ( keywords[ 'virtual' ] && ( keywords[ 'static' ] ) )
    {
        throw TypeError(
            "Cannot declare static method '" + name + "' as virtual"
        );
    }

    // do not allow overriding getters/setters
    if ( prev_data && ( prev_data.get || prev_data.set ) )
    {
        throw TypeError(
            "Cannot override getter/setter '" + name + "' with method"
        );
    }

    // search for any previous instances of this member
    if ( prev )
    {
        // disallow overriding properties with methods
        if ( !( prev instanceof Function ) )
        {
            throw TypeError(
                "Cannot override property '" + name + "' with method"
            );
        }

        // disallow overriding non-virtual methods
        if ( keywords[ 'override' ] && !( prev_keywords[ 'virtual' ] ) )
        {
            throw TypeError(
                "Cannot override non-virtual method '" + name + "'"
            );
        }

        // do not allow overriding concrete methods with abstract
        if ( keywords[ 'abstract' ] && !( util.isAbstractMethod( prev ) ) )
        {
            throw TypeError(
                "Cannot override concrete method '" + name + "' with " +
                    "abstract method"
            );
        }

        // ensure parameter list is at least the length of its supertype
        if ( ( value.__length || value.length )
            < ( prev.__length || prev.length )
        )
        {
            throw TypeError(
                "Declaration of method '" + name + "' must be compatiable " +
                    "with that of its supertype"
            );
        }

        // do not permit visibility deescalation
        if ( prev_data.visibility < getVisibilityValue( keywords ) )
        {
            throw TypeError(
                "Cannot de-escalate visibility of method '" + name + "'"
            );
        }

        // if redefining a method that has already been implemented in the
        // supertype, the default behavior is to "hide" the method of the
        // supertype, unless otherwise specified
        //
        // IMPORTANT: do this last, to ensure we throw errors before warnings
        if ( !( keywords[ 'new' ] || keywords[ 'override' ] ) )
        {
            if ( !( prev_keywords[ 'abstract' ] ) )
            {
                throw Warning( Error(
                    "Hiding method '" + name + "'; " +
                    "use 'new' if intended, or 'override' to override instead"
                ) );
            }
        }
    }
}


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
    var prev_data = scanMembers( members, name, base ),
        prev      = ( prev_data ) ? prev_data.member : null;

    // disallow overriding methods with properties
    if ( prev instanceof Function )
    {
        throw new TypeError(
            "Cannot override method '" + name + "' with property"
        );
    }

    // do not allow overriding getters/setters
    if ( prev_data && ( prev_data.get || prev_data.set ) )
     {
        throw TypeError(
            "Cannot override getter/setter '" + name + "' with property"
        );
    }

    // do not permit visibility de-escalation
    if ( prev && ( prev_data.visibility < getVisibilityValue( keywords ) ) )
    {
        throw TypeError(
            "Cannot de-escalate visibility of property '" + name + "'"
        );
    }

    // abstract properties do not make sense
    if ( keywords[ 'abstract' ] )
    {
        throw TypeError(
            "Property '" + name + "' cannot be declared as abstract"
        );
    }

    if ( keywords[ 'static' ] && keywords[ 'const' ] )
    {
        throw TypeError(
            "Static keyword cannot be used with const for property '" +
            name + "'"
        );
    }

    // properties are inherently virtual
    if ( keywords['virtual'] )
    {
        throw TypeError( "Cannot declare property '" + name + "' as virtual" );
    }

    getMemberVisibility( members, keywords )[ name ] = [ value, keywords ];
};


/**
 * Copies a getter to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
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
        getMemberVisibility( members, keywords ),
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
        getMemberVisibility( members, keywords ),
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
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @return  {Object}  reference to visibility of members argument to use
 */
function getMemberVisibility( members, keywords )
{
    var viserr = function()
    {
        throw TypeError(
            "Only one of public, protected or private may be used"
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
                visibility: ( ( fallback ) ? 0 : i ),
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
function getVisibilityValue( keywords )
{
    if ( fallback )
    {
        // if we have to fall back, we don't support levels of visibility
        return 0;
    }
    else if ( keywords[ 'protected' ] )
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


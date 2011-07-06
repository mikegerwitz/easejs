/**
 * Handles building members (properties, methods)
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
    visibility = [ 'public', 'protected', 'private' ];


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
    var prev_data = scanMembers( members, name, base ),
        prev      = ( prev_data ) ? prev_data.member : null,
        dest      = getMemberVisibility( members, keywords );
    ;

    // ensure that the declaration is valid (keywords make sense, argument
    // length, etc)
    validateMethod( keywords, prev_data, value, name );

    // we might be overriding an existing method
    if ( prev )
    {
        // override the method
        dest[ name ] = overrideMethod( prev, value, instCallback, cid );
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
        dest[ name ] = overrideMethod( value, null, instCallback, cid );
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
 * @param  {Object}  prev_data  data of member being overridden, if available
 * @param  {*}       value      property value
 * @param  {string}  name       property name
 */
function validateMethod( keywords, prev_data, value, name )
{
    var prev          = ( prev_data ) ? prev_data.member : null,
        prev_keywords = ( prev && prev.___$$keywords$$ )
            ? prev.___$$keywords$$
            : {}
    ;

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

        // if redefining non-virtual method, the new method will "hide" the
        // parent's
        //
        // IMPORTANT: do this last, to ensure we throw errors before warnings
        if ( !( prev_keywords[ 'virtual' ] || prev_keywords[ 'abstract' ] ) )
        {
            throw Warning( Error(
                "Hiding method '" + name + "'; " +
                "use 'new' if intended, or 'override' to override instead"
            ) );
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
function overrideMethod( super_method, new_method, instCallback, cid )
{
    instCallback = instCallback || function() {};

    // return a function that permits referencing the super method via the
    // __super property
    var override = null;

    // are we overriding?
    if ( new_method )
    {
        override = function()
        {
            var context = instCallback( this, cid ) || this,
                retval  = undefined
            ;

            // the _super property will contain the parent method (we don't
            // store the previous value for performance reasons and because,
            // during conventional use, it's completely unnecessary)
            context.__super = super_method;

            retval = new_method.apply( context, arguments );

            // prevent sneaky bastards from breaking encapsulation by stealing
            // method references (we set to undefined rather than deleting it
            // because deletion causes performance degradation within V8)
            context.__super = undefined;

            // if the value returned from the method was the context that we
            // passed in, return the actual instance (to ensure we do not break
            // encapsulation)
            if ( retval === context )
            {
                return this;
            }

            return retval;
        };
    }
    else
    {
        // we are defining a new method
        override = function()
        {
            var context = instCallback( this, cid ) || this,
                retval  = undefined
            ;

            // invoke the method
            retval = super_method.apply( context, arguments );

            // if the value returned from the method was the context that we
            // passed in, return the actual instance (to ensure we do not break
            // encapsulation)
            if ( retval === context )
            {
                return this;
            }

            return retval;
        };
    }

    // This is a trick to work around the fact that we cannot set the length
    // property of a function. Instead, we define our own property - __length.
    // This will store the expected number of arguments from the super method.
    // This way, when a method is being overridden, we can check to ensure its
    // compatibility with its super method.
    util.defineSecureProp( override,
        '__length',
        ( super_method.__length || super_method.length )
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


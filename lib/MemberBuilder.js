/**
 * Handles building members (properties, methods)
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
 *
 * This prototype could have easily been refactored into a number of others
 * (e.g. one for each type of member), but that refactoring has been
 * deferred until necessary to ensure ease.js maintains a relatively small
 * footprint.  Ultimately, however, such a decision is a micro-optimization
 * and shouldn't harm the design and maintainability of the software.
 *
 * TODO: Implementation is inconsistent between various members. For
 * example, methods use ___$$keywords$$, whereas properties use [ val,
 * keywords ]. Decide on a common format.
 */

var util       = require( './util' ),
    visibility = [ 'public', 'protected', 'private' ]
;


/**
 * Responsible for building class members
 *
 * @param  {Function}                wrap_method    method wrapper
 * @param  {Function}                wrap_override  method override wrapper
 * @param  {Function}                wrap_proxy     method proxy wrapper
 * @param  {MemberBuilderValidator}  validate       member validator
 *
 * @constructor
 */
module.exports = function MemberBuilder(
    wrap_method, wrap_override, wrap_proxy, validate
)
{
    // permit omitting 'new' keyword
    if ( !( this instanceof module.exports ) )
    {
        return new module.exports(
            wrap_method, wrap_override, wrap_proxy, validate
        );
    }

    this._wrapMethod   = wrap_method;
    this._wrapOverride = wrap_override;
    this._wrapProxy    = wrap_proxy;

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
 * @return  {__visobj}
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
 * The provided ``member run'' state object is required and will be
 * initialized automatically if it has not been already. For the first
 * member of a run, the object should be empty.
 *
 * @param  {__visobj}  members
 * @param  {!Object}   meta     metadata container
 * @param  {string}    name     property name
 * @param  {*}         value    property value
 *
 * @param  {!Object.<boolean>}  keywords  parsed keywords
 *
 * @param  {Function}  instCallback  function to call in order to retrieve
 *                                   object to bind 'this' keyword to
 *
 * @param  {number}   cid   class id
 * @param  {Object=}  base  optional base object to scan
 *
 * @param  {Object}  state  member run state object
 *
 * @return  {undefined}
 */
exports.buildMethod = function(
    members, meta, name, value, keywords, instCallback, cid, base, state
)
{
    // these defaults will be used whenever a keyword set is unavailable,
    // which should only ever be the case if we're inheriting from a
    // prototype rather than an ease.js class/etc
    var kdefaults = this._methodKeywordDefaults;

    // TODO: We can improve performance by not scanning each one individually
    // every time this method is called
    var prev_data     = scanMembers( members, name, base ),
        prev          = ( prev_data ) ? prev_data.member : null,
        prev_keywords = ( prev && ( prev.___$$keywords$$ || kdefaults ) ),
        dest          = getMemberVisibility( members, keywords, name );
    ;

    // ensure that the declaration is valid (keywords make sense, argument
    // length, etc)
    this._validate.validateMethod(
        name, value, keywords, prev_data, prev_keywords, state
    );

    // we might be overriding an existing method
    if ( keywords[ 'proxy' ] && !( prev && keywords.weak ) )
    {
        // TODO: Note that this is not compatible with method hiding, due to its
        // positioning (see hideMethod() below); address once method hiding is
        // implemented (the validators currently handle everything else)
        dest[ name ] = this._createProxy(
            value, instCallback, cid, name, keywords
        );
    }
    else if ( prev )
    {
        if ( keywords.weak && !( prev_keywords[ 'abstract' ] ) )
        {
            // another member of the same name has been found; discard the
            // weak declaration
            return false;
        }
        else if ( keywords[ 'override' ] || prev_keywords[ 'abstract' ] )
        {
            // if we have the `abstract' keyword at this point, then we are
            // an abstract override
            var override = ( keywords[ 'abstract' ] )
                ? aoverride( name )
                : prev;

            // override the method
            dest[ name ] = this._overrideMethod(
                override, value, instCallback, cid
            );
        }
        else
        {
            // by default, perform method hiding, even if the keyword was not
            // provided (the keyword simply suppresses the warning)
            dest[ name ] = hideMethod( prev, value, instCallback, cid );
        }

    }
    else if ( keywords[ 'abstract' ] || keywords[ 'private' ] )
    {
        // we do not want to wrap abstract methods, since they are not
        // callable; further, we do not need to wrap private methods, since
        // they are only ever accessible when we are already within a
        // private context (see test case for more information)
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
    return true;
};


/**
 * Default keywords to apply to methods inherited from a prototype.
 * @type  {Object}
 */
exports._methodKeywordDefaults = { 'virtual': true };


/**
 * Creates an abstract override super method proxy to NAME
 *
 * This is a fairly abstract concept that is disastrously confusing without
 * having been put into the proper context: This function is intended to be
 * used as a super method for a method override in the case of abstract
 * overrides. It only makes sense to be used, at least at this time, with
 * mixins.
 *
 * When called, the bound context (`this') will be the private member object
 * of the caller, which should contain a reference to the protected member
 * object of the supertype to proxy to. It is further assumed that the
 * protected member object (pmo) defines NAME such that it proxies to a
 * mixin; this means that invoking it could result in an infinite loop. We
 * therefore skip directly to the super-super method, which will be the
 * method we are interested in proxying to.
 *
 * There is one additional consideration: If this super method is proxying
 * from a mixin instance into a class, then it is important that we bind the
 * calling context to the pmo instaed of our own context; otherwise, we'll
 * be executing within the context of the trait, without access to the
 * members of the supertype that we are proxying to! The pmo will be used by
 * the ease.js method wrapper to look up the proper private member object,
 * so it is not a problem that the pmo is being passed in.
 *
 * That's a lot of text for such a small amount of code.
 *
 * @param  {string}  name  name of method to proxy to
 *
 * @return  {Function}  abstract override super method proxy
 */
function aoverride( name )
{
    return function()
    {
        return this.___$$super$$.prototype[ name ]
            .apply( this.___$$pmo$$, arguments );
    };
}


/**
 * Copies a property to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * @param  {__visobj}  members
 * @param  {!Object}   meta     metadata container
 * @param  {string}    name     property name
 * @param  {*}         value    property value
 *
 * @param  {!Object.<boolean>}  keywords  parsed keywords
 *
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
 * Copies a getter/setter to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * TODO: This should essentially mirror buildMethod with regards to overrides,
 * proxies, etc.
 *
 * @param  {!__visobj}  members
 * @param  {!Object}    meta     metadata container
 * @param  {string}     name     getter name
 * @param  {*}          get      getter value
 * @param  {*}          set      setter value
 *
 * @param  {!Object.<boolean>}  keywords  parsed keywords
 *
 * @param  {Function}  instCallback  function to call in order to retrieve
 *                                   object to bind 'this' keyword to
 *
 * @param  {number}   cid   class id
 * @param  {Object=}  base  optional base object to scan
 *
 * @return  {undefined}
 *
 * Closure Compiler is improperly throwing warnings on Object.defineProperty():
 * @suppress {checkTypes}
 */
exports.buildGetterSetter = function(
    members, meta, name, get, set, keywords, instCallback, cid, base
)
{
    var prev_data     = scanMembers( members, name, base ),
        prev_keywords = ( ( prev_data && prev_data.get )
            ? prev_data.get.___$$keywords$$
            : null
        )
    ;

    this._validate.validateGetterSetter(
        name, {}, keywords, prev_data, prev_keywords
    );

    if ( get )
    {
        get = this._overrideMethod( null, get, instCallback, cid );

        // ensure we store the keywords *after* the override, otherwise they
        // will be assigned to the wrapped function (the getter)
        get.___$$keywords$$ = keywords;
    }

    Object.defineProperty(
        getMemberVisibility( members, keywords, name ),
        name,
        {
            get: get,
            set: ( set )
                ? this._overrideMethod( null, set, instCallback, cid )
                : set,

            enumerable:   true,
            configurable: false,
        }
    );
};


/**
 * Returns member prototype to use for the requested visibility
 *
 * Will throw an exception if multiple access modifiers were used.
 *
 * @param  {__visobj} members
 *
 * @param  {!Object.<boolean>}  keywords  parsed keywords
 * @param  {string}             name      member name
 *
 * @return  {Object}  reference to visibility of members argument to use
 */
function getMemberVisibility( members, keywords, name )
{
    // there's cleaner ways of doing this, but consider it loop unrolling for
    // performance
    if ( keywords[ 'private' ] )
    {
        ( keywords[ 'public' ] || keywords[ 'protected' ] )
            && viserr( name );
        return members[ 'private' ];
    }
    else if ( keywords[ 'protected' ] )
    {
        ( keywords[ 'public' ] || keywords[ 'private' ] )
            && viserr( name );
        return members[ 'protected' ];
    }
    else
    {
        // public keyword is the default, so explicitly specifying it is only
        // for clarity
        ( keywords[ 'private' ] || keywords[ 'protected' ] )
            && viserr( name );
        return members[ 'public' ];
    }
}

function viserr( name )
{
    throw TypeError(
        "Only one access modifier may be used for definition of '" +
            name + "'"
    );
}



/**
 * Scan each level of visibility for the requested member
 *
 * @param  {__visobj} members
 *
 * @param  {string}   name  member to locate
 * @param  {Object=}  base  optional base object to scan
 *
 * @return  {{get,set,member}|null}
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

        // we must recurse on *all* the visibility objects of the base's
        // supertype; attempt to find the class associated with its
        // supertype, if any
        var base2 = ( ( base.prototype || {} ).___$$parent$$ || {} )
            .constructor;

        // scan the base's methods and properties, if they are available
        return ( base_methods && scanMembers( base_methods, name, base2 ) )
            || ( base_props && scanMembers( base_props, name, base2 ) )
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
 * Create a method that proxies to the method of another object
 *
 * @param  {string}  proxy_to  name of property (of instance) to proxy to
 *
 * @param  {Function}  instCallback  function to call in order to retrieve
 *                                   object to bind 'this' keyword to
 *
 * @param  {number}  cid       class id
 * @param  {string}  mname     name of method to invoke on destination object
 * @param  {Object}  keywords  method keywords
 *
 * @return  {Function}  proxy method
 */
exports._createProxy = function( proxy_to, instCallback, cid, mname, keywords )
{
    return this._wrapProxy.wrapMethod(
        proxy_to, null, cid, instCallback, mname, keywords
    );
};


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
 * @param  {Function}  instCallback  function to call in order to retrieve
 *                                   object to bind 'this' keyword to
 *
 * @param  {number}   cid  class id
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


/**
 * End member run and perform post-processing on state data
 *
 * A ``member run'' should consist of the members required for a particular
 * object (class/interface/etc). This action will perform validation
 * post-processing if a validator is available.
 *
 * @param  {Object}  state  member run state
 *
 * @return  {undefined}
 */
exports.end = function( state )
{
    this._validate && this._validate.end( state );
};

/**
 * Default method wrapper functions
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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

/**
 * Method wrappers for standard (non-fallback)
 * @type {Object}
 */
exports.standard = {
    wrapOverride: function( method, super_method, cid, getInst )
    {
        var retf = function()
        {
            // we need some sort of context in order to set __super; it may
            // be undefined per strict mode requirements depending on how
            // the method was invoked
            var context = getInst( this, cid ) || this || {},
                retval  = undefined
            ;

            // the _super property will contain the parent method (store the
            // previous value to ensure that calls to multiple overrides will
            // be supported)
            var psup = context.__super;
            context.__super = super_method;

            retval = method.apply( context, arguments );

            // prevent sneaky bastards from breaking encapsulation by stealing
            // method references and ensure that __super is properly restored
            // for nested/multiple override invocations
            context.__super = psup;

            // if the value returned from the method was the context that we
            // passed in, return the actual instance (to ensure we do not break
            // encapsulation)
            if ( retval === context )
            {
                return this;
            }

            return retval;
        };

        // `super` is reserved and, in ES3, this causes problems with the
        // dot-notation; while `foo.super` will work fine in modern (ES5)
        // browsers, we need to maintain our ES3 compatibility
        retf['super'] = super_method;

        return retf;
    },


    wrapNew: function( method, super_method, cid, getInst )
    {
        return function()
        {
            var context = getInst( this, cid ) || this,
                retval  = undefined
            ;

            // invoke the method
            retval = method.apply( context, arguments );

            // if the value returned from the method was the context that we
            // passed in, return the actual instance (to ensure we do not break
            // encapsulation)
            if ( retval === context )
            {
                return this;
            }

            return retval;
        };
    },


    wrapProxy: function( proxy_to, _, cid, getInst, name, keywords )
    {
        // it is important that we store only a boolean value as to whether or
        // not this method is static *outside* of the returned closure, so as
        // not to keep an unnecessary reference to the keywords object
        var is_static = keywords && keywords[ 'static' ];

        var ret = function()
        {
            var context = getInst( this, cid ) || this,
                retval  = undefined,
                dest    = ( ( is_static )
                    ? context.$( proxy_to )
                    : context[ proxy_to ]
                )
            ;

            // rather than allowing a cryptic error to be thrown, attempt to
            // detect when the proxy call will fail and provide a useful error
            // message
            if ( !( ( dest !== null ) && ( typeof dest === 'object' )
                && ( typeof dest[ name ] === 'function' )
            ) )
            {
                throw TypeError(
                    "Unable to proxy " + name + "() call to '" + proxy_to +
                    "'; '" + proxy_to + "' is undefined or '" + name +
                    "' is not a function."
                );
            }

            retval = dest[ name ].apply( dest, arguments );

            // if the object we are proxying to returns itself, then instead
            // return a reference to *ourself* (so as not to break encapsulation
            // and to provide a more consistent and sensible API)
            return ( retval === dest )
                ? this
                : retval;
        };

        // ensures that proxies can be used to provide concrete
        // implementations of abstract methods with param requirements (we
        // have no idea what we'll be proxying to at runtime, so we need to
        // just power through it; see test case for more info)
        ret.__length = NaN;
        return ret;
    },
};


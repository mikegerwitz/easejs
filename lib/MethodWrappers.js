/**
 * Default method wrapper functions
 *
 *  Copyright (C) 2010,2011 Mike Gerwitz
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

/**
 * Method wrappers for standard (non-fallback)
 * @type {Object}
 */
exports.standard = {
    wrapOverride: function( method, super_method, cid, getInst )
    {
        return function()
        {
            var context = getInst( this, cid ) || this,
                retval  = undefined
            ;

            // the _super property will contain the parent method (we don't
            // store the previous value for performance reasons and because,
            // during conventional use, it's completely unnecessary)
            context.__super = super_method;

            retval = method.apply( context, arguments );

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

        return function()
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
    },
};


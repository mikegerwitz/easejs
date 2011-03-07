/**
 * Contains property object generator
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

var util = require( './util' ),

    // whether or not we support defining properties through
    // Object.defineProperty()
    defprop = ( Object.defineProperty !== undefined ) ? true : false;
;


exports.setup = function( base, dest, properties, members )
{
    var prop_pub  = properties[ 'public' ],
        prop_prot = properties[ 'protected' ],
        prop_priv = properties[ 'private' ]
    ;

    // initialize each of the properties for this instance to
    // ensure we're not sharing references to prototype values
    for ( prop in prop_pub )
    {
        // initialize the value with a clone to ensure that they do
        // not share references (and therefore, data)
        base[ prop ] = util.clone( prop_pub[ prop ] );
    }

    var methods_protected = members[ 'protected' ],
        methods_private   = members[ 'private' ],
        hasOwn            = Array.prototype.hasOwnProperty
    ;

    // copy over the methods
    for ( method_name in methods_protected )
    {
        if ( hasOwn.call( methods_protected, method_name ) )
        {
            dest[ method_name ] = methods_protected[ method_name ];
        }
    }
    for ( method_name in methods_private )
    {
        if ( hasOwn.call( methods_private, method_name ) )
        {
            dest[ method_name ] = methods_private[ method_name ];
        }
    }

    // initialize private/protected properties and store in instance data
    for ( prop in prop_prot )
    {
        dest[ prop ] = util.clone( prop_prot[ prop ] );
    }
    for ( prop in prop_priv )
    {
        dest[ prop ] = util.clone( prop_priv[ prop ] );
    }
};


/**
 * Creates a proxy for all given properties to the given base
 *
 * The proxy uses getters/setters to forward all calls to the base. The
 * destination object will be used as the proxy. All properties within props
 * will be used proxied.
 *
 * To summarize: for each property in props, all gets and sets will be forwarded
 * to base.
 *
 * @param  {Object}  base   object to proxy to
 * @param  {Object}  dest   object to treat as proxy (set getters/setters on)
 * @param  {Object}  props  properties to proxy
 *
 * @return  {Object}  returns dest
 */
exports.createPropProxy = function( base, dest, props )
{
    var hasOwn = Object.prototype.hasOwnProperty;

    if ( !defprop )
    {
        return base;
    }

    for ( prop in props )
    {
        if ( !( hasOwn.call( props, prop ) ) )
        {
            continue;
        }

        ( function( prop )
        {
            // just in case it's already defined, so we don't throw an error
            dest[ prop ] = undefined;

            // public properties, when set internally, must forward to the
            // actual variable
            Object.defineProperty( dest, prop, {
                set: function( val )
                {
                    base[ prop ] = val;
                },

                get: function()
                {
                    return base[ prop ];
                },

                enumerable:   true,
            } );
        } ).call( null, prop );
    }

    return dest;
};


/**
 * Returns whether property proxying is supported
 *
 * Proxying is done via getters and setters. If the JS engine doesn't support
 * them (pre-ES5), then the proxy will not work.
 *
 * @return  {boolean}  true if supported, otherwise false
 */
exports.supportsPropProxy = function()
{
    return defprop;
};


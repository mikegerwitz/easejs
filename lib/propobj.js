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
    defprop = !( util.definePropertyFallback() );
;


/**
 * Sets up properties when inheriting
 *
 * This does not include private members.
 *
 * @param  {Object}   dest        destination object
 * @param  {Object}   properties  properties to copy
 * @param  {Object=}  methods     methods to copy
 *
 * @return  {Object}  dest
 */
exports.setupInherited = function( dest, properties, methods )
{
    // initialize each of the properties for this instance to
    // ensure we're not sharing references to prototype values
    doSetup( dest, properties[ 'public' ] );
    doSetup( dest, properties[ 'protected' ], methods[ 'protected'] );

    return dest;
};


/**
 * Sets up properties (non-inheriting)
 *
 * This includes all members (including private). Private members will be set up
 * in a separate object, so that they can be easily removed from the mix. That
 * object will include the destination object in the prototype, so that the
 * access should be transparent. This object is returned.
 *
 * @param  {Object}   dest        destination object
 * @param  {Object}   properties  properties to copy
 * @param  {Object=}  methods     methods to copy
 *
 * @return  {Object}  object containing private members and dest as prototype
 */
exports.setup = function( dest, properties, methods )
{
    // this constructor is an extra layer atop of the destination object, which
    // will contain the private methods
    var obj_ctor = function() {};
    obj_ctor.prototype = dest;

    var obj = new obj_ctor();

    // first, set up the public and protected members
    exports.setupInherited( dest, properties, methods );

    // then add the private parts
    doSetup( obj, properties[ 'private' ], methods[ 'private' ] );

    return obj;
};


/**
 * Set up destination object by copying over properties and methods
 *
 * @param  {Object}   dest        destination object
 * @param  {Object}   properties  properties to copy
 * @param  {Object=}  methods     methods to copy
 *
 * @return  {undefined}
 */
function doSetup( dest, properties, methods )
{
    var hasOwn = Array.prototype.hasOwnProperty;

    // copy over the methods
    if ( methods !== undefined )
    {
        for ( method_name in methods )
        {
            if ( hasOwn.call( methods, method_name ) )
            {
                dest[ method_name ] = methods[ method_name ];
            }
        }
    }

    // initialize private/protected properties and store in instance data
    for ( prop in properties )
    {
        if ( hasOwn.call( properties, prop ) )
        {
            dest[ prop ] = util.clone( properties[ prop ] );
        }
    }
}


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


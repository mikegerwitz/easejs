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

var util = require( __dirname + '/util' ),

    // whether or not we support defining properties through
    // Object.defineProperty()
    defprop = !( util.definePropertyFallback() );
;


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
    var obj = dest;

    // this constructor is an extra layer atop of the destination object, which
    // will contain the private methods
    if ( defprop )
    {
        var obj_ctor = function() {};
        obj_ctor.prototype = dest;

        obj = new obj_ctor();
    }

    // initialize each of the properties for this instance to
    // ensure we're not sharing references to prototype values
    doSetup( dest, properties[ 'public' ] );

    // Do the same for protected, but only if they do not exist already in
    // public. The reason for this is because the property object is laid /atop/
    // of the public members, meaning that a parent's protected members will
    // take precedence over a subtype's overriding /public/ members. Uh oh.
    doSetup( dest, properties[ 'protected' ], methods[ 'protected' ], true );

    // then add the private parts
    doSetup( obj, properties[ 'private' ], methods[ 'private' ] );

    return obj;
};


/**
 * Set up destination object by copying over properties and methods
 *
 * @param  {Object}   dest           destination object
 * @param  {Object}   properties     properties to copy
 * @param  {Object=}  methods        methods to copy
 * @param  {boolean}  unless_exists  do not set if method already exists in dest
 *
 * @return  {undefined}
 */
function doSetup( dest, properties, methods, unless_exists )
{
    unless_exists = !!unless_exists;

    var hasOwn = Array.prototype.hasOwnProperty;

    // copy over the methods
    if ( methods !== undefined )
    {
        for ( method_name in methods )
        {
            if ( hasOwn.call( methods, method_name ) )
            {
                // If requested, do not copy the method over if it already
                // exists in the destination object. Don't use hasOwn here;
                // unnecessary overhead and we want to traverse any prototype
                // chains. We do not check the public object directly, for
                // example, because we need a solution that will work if a proxy
                // is unsupported by the engine.
                if ( !unless_exists || ( dest[ method_name ] === undefined ) )
                {
                    dest[ method_name ] = methods[ method_name ];
                }
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


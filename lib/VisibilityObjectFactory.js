/**
 * Contains visibility object factory
 *
 *  Copyright (C) 2011, 2013, 2014 Free Software Foundation, Inc.
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
 * XXX: tightly coupled
 */
var util = require( './util' );


/**
 * Initializes visibility object factory
 *
 * The visibility object is the "magic" behind ease.js. This factory creates the
 * object that holds the varying levels of visibility, which are swapped out and
 * inherited depending on circumstance.
 *
 * @constructor
 */
module.exports = exports = function VisibilityObjectFactory()
{
    // permit omitting 'new' keyword
    if ( !( this instanceof exports ) )
    {
        // module.exports instead of exports because Closure Compiler seems to
        // be confused
        return new module.exports();
    }
};


/**
 * Sets up properties
 *
 * This includes all members (including private). Private members will be set up
 * in a separate object, so that they can be easily removed from the mix. That
 * object will include the destination object in the prototype, so that the
 * access should be transparent. This object is returned.
 *
 * Properties are expected in the following format. Note that keywords are
 * ignored:
 *     { public: { prop: [ value, { keyword: true } ] } }
 *
 * @param  {Object}   dest        destination object
 * @param  {Object}   properties  properties to copy
 * @param  {Object=}  methods     methods to copy
 *
 * @return  {Object}  object containing private members and dest as prototype
 */
exports.prototype.setup = function setup( dest, properties, methods )
{
    // create the private layer atop of the destination object
    var obj = this._createPrivateLayer( dest, properties );

    // initialize each of the properties for this instance to
    // ensure we're not sharing references to prototype values
    this._doSetup( dest, properties[ 'public' ] );

    // Do the same for protected, but only if they do not exist already in
    // public. The reason for this is because the property object is laid /atop/
    // of the public members, meaning that a parent's protected members will
    // take precedence over a subtype's overriding /public/ members. Uh oh.
    this._doSetup( dest,
        properties[ 'protected' ],
        methods[ 'protected' ],
        true
    );

    // then add the private parts
    this._doSetup( obj, properties[ 'private' ], methods[ 'private' ] );

    return obj;
};


/**
 * Add an extra layer atop the destination object, which will contain the
 * private members
 *
 * The object provided will be used as the prototype for the new private layer,
 * so the provided object will be accessible on the prototype chain.
 *
 * Subtypes may override this method to alter the functionality of the private
 * visibility object (e.g. to prevent it from being created).
 *
 * @param  {Object}  atop_of     object to add private layer atop of
 * @param  {Object}  properties  properties
 *
 * @return  {Object}  private layer with given object as prototype
 */
exports.prototype._createPrivateLayer = function( atop_of, properties )
{
    /** @constructor */
    var obj_ctor = function() {};
    obj_ctor.prototype = atop_of;

    // we'll be returning an instance, so that the prototype takes effect
    var obj = new obj_ctor();

    // All protected properties need to be proxied from the private object
    // (which will be passed as the context) to the object containing protected
    // values. Otherwise, the protected property values would be set on the
    // private object, making them inaccessible to subtypes.
    this.createPropProxy( atop_of, obj, properties[ 'protected' ] );

    return obj;
};


/**
 * Set up destination object by copying over properties and methods
 *
 * The prot_priv parameter can be used to ignore both explicitly and
 * implicitly public methods.
 *
 * @param  {Object}   dest        destination object
 * @param  {Object}   properties  properties to copy
 * @param  {Object}   methods     methods to copy
 * @param  {boolean}  prot_priv   do not set unless protected or private
 *
 * @return  {undefined}
 */
exports.prototype._doSetup = function(
    dest, properties, methods, prot_priv
)
{
    var hasOwn = Array.prototype.hasOwnProperty;

    // copy over the methods
    if ( methods !== undefined )
    {
        for ( var method_name in methods )
        {
            if ( hasOwn.call( methods, method_name ) )
            {
                var pre = dest[ method_name ],
                    kw  = pre && pre.___$$keywords$$;

                // If requested, do not copy the method over if it already
                // exists in the destination object. Don't use hasOwn here;
                // unnecessary overhead and we want to traverse any prototype
                // chains. We do not check the public object directly, for
                // example, because we need a solution that will work if a proxy
                // is unsupported by the engine.
                //
                // Also note that we need to allow overriding if it exists in
                // the protected object (we can override protected with
                // protected). This is the *last* check to ensure a performance
                // hit is incured *only* if we're overriding protected with
                // protected.
                if ( !prot_priv
                    || ( pre === undefined )
                    || ( kw[ 'private' ] || kw[ 'protected' ] )
                )
                {
                    dest[ method_name ] = methods[ method_name ];
                }
            }
        }
    }

    // initialize private/protected properties and store in instance data
    for ( var prop in properties )
    {
        if ( hasOwn.call( properties, prop ) )
        {
            dest[ prop ] = util.clone( properties[ prop ][ 0 ] );
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
 * Please note that this does not use the JS proxy implementation. That will be
 * done in the future for engines that support it.
 *
 * @param  {Object}  base   object to proxy to
 * @param  {Object}  dest   object to treat as proxy (set getters/setters on)
 * @param  {Object}  props  properties to proxy
 *
 * @return  {Object}  returns dest
 */
exports.prototype.createPropProxy = function( base, dest, props )
{
    var hasOwn = Object.prototype.hasOwnProperty;

    for ( var prop in props )
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

                enumerable: true,
            } );
        } ).call( null, prop );
    }

    return dest;
};


/**
 * Contains basic inheritance mechanism
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


/**
 * Default class implementation
 *
 * @return undefined
 */
var Class = function()
{
};


/**
 * Copies properties to the destination object
 *
 * The destination object is directly modified.
 *
 * @param  {Object}  props  properties to copy
 * @param  {Object}  dest   destination object
 *
 * @return undefined
 */
var prop_copy = function( props, dest )
{
    // copy each of the properties to the destination object
    for ( property in props )
    {
        // if the property already exists, then it's being overridden (we only
        // care about methods - properties will simply have their values
        // overwritten)
        var pre = dest[ property ];
        if ( ( pre !== undefined ) && ( pre instanceof Function ) )
        {
            dest[ property ] = ( function( method, super_method )
            {
                // this is the method that will be invoked when the requested
                // method is called, so note that in the context of this
                // function, `this` will represent the current class instance
                return function()
                {
                    var tmp = this.__super;

                    // assign _super temporarily for the method invocation so
                    // that the method can call the parent method
                    this.__super = super_method;
                    var retval  = method.apply( this, arguments );
                    this.__super = tmp;

                    return retval;
                }
            })( props[ property ], dest[ property ] );
        }
        else
        {
            dest[ property ] = props[ property ];
        }
    }
}


/**
 * Mimics class inheritance
 *
 * This method will mimic inheritance by setting up the prototype with the
 * provided base class (or, by default, Class) and copying the additional
 * properties atop of it.
 *
 * The class to inherit from (the first argument) is optional. If omitted, the
 * first argument will be considered to be the properties list.
 *
 * @return  {Object}  extended class
 */
var extend = function()
{
    var args  = Array.prototype.slice.call( arguments ),
        props = args.pop() || {},
        base  = args.pop() || Class,

        prototype = new base(),
        new_class = function()
        {
            if ( this.__construct instanceof Function )
            {
                this.__construct.apply( this, arguments );
            }
        };

    // copy the given properties into the new prototype
    prop_copy( props, prototype );

    // reference to the parent prototype (for more experienced users)
    prototype.parent = base.prototype;

    // set up the new class
    attach_extend( new_class );
    new_class.prototype   = prototype;
    new_class.constructor = new_class;

    return new_class;
}


/**
 * Creates a class, inheriting either from the provided base class or the
 * default base class
 *
 * @param  {Object}  base  object to extend (extends Class by default)
 *
 * @return  {Object}  extended class
 */
exports.extend = function( base )
{
    return extend.apply( this, arguments );
}


var attach_extend = function( func )
{
    /**
     * Shorthand for extending classes
     *
     * This method can be invoked on the object, rater than having to call
     * Class.extend( this ).
     *
     * @param  {Object}  props  properties to add to extended class
     *
     * @return  {Object}  extended class
     */
    Object.defineProperty( func, 'extend',
    {
        value: function( props )
        {
            return extend( this, props );
        },

        enumerable:   false,
        writable:     false,
        configurable: false,
    } );
}

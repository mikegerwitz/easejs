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

// whether getters/setters are supported
var getset = ( Object.prototype.__defineGetter__ === undefined )
    ? false
    : true
;


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


/**
 * Creates an abstract method
 *
 * Abstract methods must be implemented by a subclass and cannot be called
 * directly. If a class contains a single abstract method, the class itself is
 * considered to be abstract and cannot be instantiated. It may only be
 * extended.
 *
 * @param  {Function}  definition  function definition that concrete
 *                                 implementations must follow
 *
 * @return  {Function}
 */
exports.abstractMethod = function( definition )
{
    var method = function()
    {
        throw new Error( "Cannot call abstract method" );
    };

    method.abstractFlag = true;
    return method;
}


/**
 * Default class implementation
 *
 * @return undefined
 */
function Class() {};


/**
 * Copies properties to the destination object
 *
 * If the method already exists, it will be overridden and accessible via either
 * the parent prototype or by invoking this.__super().
 *
 * The destination object is directly modified.
 *
 * The result data will be populated with information from the copy that may be
 * useful to the creation of the class (e.g. list of the abstract methods).
 *
 * @param  {Object}  props        properties to copy
 * @param  {Object}  dest         destination object
 * @param  {Object}  result_data  object to store data regarding the copy in
 *
 * @return undefined
 */
function prop_copy( props, dest, result_data )
{
    result_data = result_data || {};

    // initialize result_data
    result_data.abstractMethods = [];

    // copy each of the properties to the destination object
    for ( property in props )
    {
        // if the property already exists, then it's being overridden (we only
        // care about methods - properties will simply have their values
        // overwritten)
        var pre    = dest[ property ],
            prop   = props[ property ],
            getter = ( ( getset ) ? props.__lookupGetter__( property ) : null ),
            setter = ( ( getset ) ? props.__lookupSetter__( property ) : null );

        // did we find an abstract method?
        if ( ( prop instanceof Function ) && ( prop.abstractFlag === true ) )
        {
            result_data.abstractMethods.push( property );
        }

        // check for getter/setter overrides
        if ( getter || setter )
        {
            if ( getter )
            {
                dest.__defineGetter__( property, getter );
            }

            if ( setter )
            {
                dest.__defineSetter__( property, setter );
            }
        }
        // check for method overrides
        else if ( ( pre !== undefined ) && ( pre instanceof Function ) )
        {
            // ensure we're overriding the method with another method
            if ( !( prop instanceof Function ) )
            {
                throw new TypeError( "Cannot override method with non-method" );
            }

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
            })( prop, dest[ property ] );
        }
        else
        {
            dest[ property ] = prop;
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
function extend()
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
    var result_data = {};
    prop_copy( props, prototype, result_data );

    // reference to the parent prototype (for more experienced users)
    prototype.parent = base.prototype;

    // set up the new class
    setup_props( new_class, result_data );
    new_class.prototype   = prototype;
    new_class.constructor = new_class;

    return new_class;
}


/**
 * Sets up common properties for the provided function (class)
 *
 * @param  {Function}  func        function (class) to attach properties to
 * @param  {Object}    class_data  information about the class
 *
 * @return  {undefined}
 */
function setup_props( func, class_data )
{
    attach_abstract( func, class_data.abstractMethods );
    attach_extend( func );
}


/**
 * Attaches isAbstract() method to the class
 *
 * @param  {Function}  func     function (class) to attach method to
 * @param  {Array}     methods  abstract method names
 *
 * @return  {undefined}
 */
function attach_abstract( func, methods )
{
    var is_abstract = ( methods.length > 0 ) ? true: false;

    /**
     * Returns whether the class contains abstract methods (and is therefore
     * abstract)
     *
     * @return  {Boolean}  true if class is abstract, otherwise false
     */
    func.isAbstract = function()
    {
        return is_abstract;
    };
}


/**
 * Attaches extend method to the given function (class)
 *
 * @param  {Function}  func  function (class) to attach method to
 *
 * @return  {undefined}
 */
function attach_extend( func )
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
    var ext_method = function( props )
    {
        return extend( this, props );
    };

    // if defineProperty is unsupported, do it the old fashioned way (it's just
    // less restrictive)
    if ( Object.defineProperty === undefined )
    {
        func.extend = ext_method;
    }
    else
    {
        Object.defineProperty( func, 'extend',
        {
            value: ext_method,

            enumerable:   false,
            writable:     false,
            configurable: false,
        } );
    }
}

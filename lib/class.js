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

    define_secure_prop( method, 'abstractFlag', true );
    define_secure_prop( method, 'definition', definition );

    return method;
}


/**
 * Default class implementation
 *
 * @return undefined
 */
function Class() {};




/**
 * Set to TRUE when class is being extended to allow the instantiation of
 * abstract classes (for use in prototypes)
 *
 * @var  {boolean}
 */
var extending = false;

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
    // ensure we'll be permitted to instantiate abstract classes for the base
    extending = true;

    var args      = Array.prototype.slice.call( arguments ),
        props     = args.pop() || {},
        base      = args.pop() || Class,
        prototype = new base();

    // copy the given properties into the new prototype
    var result_data = {
        abstractMethods: ( base.abstractMethods || [] ).slice()
    };
    prop_copy( props, prototype, result_data );

    // reference to the parent prototype (for more experienced users)
    prototype.parent = base.prototype;

    var new_class = ( result_data.abstractMethods.length === 0 )
        ? (
            // concrete class
            function()
            {
                if ( this.__construct instanceof Function )
                {
                    // call the constructor
                    this.__construct.apply( this, arguments );
                }
            }
        )
        : (
            // do not allow abstract classes to be instantiated
            function ()
            {
                if ( !extending )
                {
                    throw new Error( "Abstract classes cannot be instantiated" );
                }
            }
        );

    // set up the new class
    setup_props( new_class, result_data );
    new_class.prototype   = prototype;
    new_class.constructor = new_class;

    // we're done with the extension process
    extending = false;

    return new_class;
}


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
    var abstract_methods =
        result_data.abstractMethods = result_data.abstractMethods || [];

    // it's much faster to lookup a hash than it is to iterate through an entire
    // array each time we need to find an existing abstract method
    var abstract_map   = {},
        abstract_regen = false;
    for ( var i = 0, len = abstract_methods.length; i < len; i++ )
    {
        var method = abstract_methods[ i ];
        abstract_map[ method ] = i;
    }

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
            var data = { abstractModified: false };

            dest[ property ] = method_override(
                pre,
                prop,
                property,
                abstract_map,
                abstract_methods,
                data
            );

            if ( data.abstractModified )
            {
                abstract_regen = true;
            }
        }
        // just copy over the property
        else
        {
            // if we were given an abstract method, add it to our list of
            // abstract methods
            if ( ( prop instanceof Function ) && ( prop.abstractFlag === true ) )
            {
                abstract_methods.push( property );
            }

            dest[ property ] = prop;
        }
    }

    // should we regenerate the array of abstract methods? (this must be done
    // because the length of the array remains the same after deleting elements)
    if ( abstract_regen )
    {
        result_data.abstractMethods = array_shrink( abstract_methods );
    }
}


/**
 * Overrides a method
 *
 * The given method must be a function or an exception will be thrown.
 *
 * @param  {Function}  super_method      method to override
 * @param  {Function}  new_method        method to override with
 * @param  {string}    name              method name
 * @param  {Object}    abstract_map      lookup table for abstract methods
 * @param  {Array}     abstract_methods  list of abstract methods
 * @param  {Object}    data              object in which to store result data
 *
 * @return  {Function}  overridden method
 */
function method_override(
    super_method, new_method, name, abstract_map, abstract_methods, data
)
{
    // ensure we're overriding the method with another method
    if ( !( new_method instanceof Function ) )
    {
        throw new TypeError( "Cannot override method with non-method" );
    }

    // if we were given a concrete method to an abstract method,
    // then the method should no longer be considered abstract
    if ( ( abstract_map[ name ] !== undefined )
        && ( new_method.abstractFlag !== true )
    )
    {
        if ( super_method.definition instanceof Function )
        {
            // ensure the concrete definition is compatible with
            // that of its supertype
            if ( new_method.length < super_method.definition.length )
            {
                throw new Error(
                    "Declaration of " + name + " must be compatiable" +
                        "with that of its supertype"
                );
            }
        }

        delete abstract_methods[ abstract_map[ name ] ];
        data.abstractModified = true;
    }

    // this is the method that will be invoked when the requested
    // method is called, so note that in the context of this
    // function, `this` will represent the current class instance
    return function()
    {
        var tmp = this.__super;

        // assign _super temporarily for the method invocation so
        // that the method can call the parent method
        this.__super = super_method;
        var retval  = new_method.apply( this, arguments );
        this.__super = tmp;

        return retval;
    }
}


/**
 * Shrinks an array, removing undefined elements
 *
 * Pushes all items onto a new array, removing undefined elements. This ensures
 * that the length of the array represents correctly the number of elements in
 * the array.
 *
 * @param  {Array}  items  array to shrink
 *
 * @return  {Array}  shrunken array
 */
function array_shrink( items )
{
    // copy the methods into a new array by pushing them onto it, to ensure
    // the length property of the array will work properly
    var arr_new = [];
    for ( var i = 0, len = items.length; i < len; i++ )
    {
        var item = items[ i ];
        if ( item === undefined )
        {
            continue;
        }

        arr_new.push( item );
    }

    return arr_new;
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
 * Attempts to define a non-enumerable, non-writable and non-configurable
 * property on the given object
 *
 * If the operation is unsupported, a normal property will be set.
 *
 * @param  {Object}  obj    object to set property on
 * @param  {string}  prop   name of property to set
 * @param  {mixed}   value  value to set
 *
 * @return  {undefined}
 */
function define_secure_prop( obj, prop, value )
{
    if ( Object.defineProperty === undefined )
    {
        func[ prop ] = value;
    }
    else
    {
        Object.defineProperty( obj, prop,
        {
            value: value,

            enumerable:   false,
            writable:     false,
            configurable: false,
        });
    }
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
    define_secure_prop( func, 'isAbstract', function()
    {
        return is_abstract;
    });

    // attach the list of abstract methods to the class (make the copy of the
    // methods to ensure that they won't be gc'd or later modified and screw up
    // the value)
    define_secure_prop( func, 'abstractMethods', methods );
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
    define_secure_prop( func, 'extend', function( props )
    {
        return extend( this, props );
    });
}


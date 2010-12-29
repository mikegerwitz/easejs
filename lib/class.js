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

var util = require( './util' );


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
 * Determines whether the provided object is a class created through ease.js
 *
 * @param  {Object}  obj  object to test
 *
 * @return  {boolean}  true if class (created through ease.js), otherwise false
 */
exports.isClass = function( obj )
{
    obj = obj || {};

    return ( obj.prototype instanceof Class )
        ? true
        : false
    ;
};


/**
 * Determines whether the provided object is an instance of a class created
 * through ease.js
 *
 * @param  {Object}  obj  object to test
 *
 * @return  {boolean}  true if instance of class (created through ease.js),
 *                     otherwise false
 */
exports.isClassInstance = function( obj )
{
    obj = obj || {};

    return ( obj instanceof Class )
        ? true
        : false;
};


/**
 * Default class implementation
 *
 * @return undefined
 */
function Class() {};




/**
 * Creates extend function
 *
 * The 'extending' parameter is used to override the functionality of abstract
 * class constructors, allowing them to be instantiated for use in a subclass's
 * prototype.
 *
 * @param  {boolean}  extending  whether a class is currently being extended
 *
 * @return  {Function}  extend function
 */
var extend = ( function( extending )
{
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
    return function extend()
    {
        // ensure we'll be permitted to instantiate abstract classes for the base
        extending = true;

        var args      = Array.prototype.slice.call( arguments ),
            props     = args.pop() || {},
            base      = args.pop() || Class,
            prototype = new base();

        var properties       = {},
            abstract_methods = ( base.abstractMethods || [] ).slice();

        util.propCopy( props, prototype, {
            each: function( name, value )
            {
                // disallow use of our internal __initProps() method
                if ( name === '__initProps' )
                {
                    throw new Error( "__initProps is a reserved method" );
                }

                this.performDefault( name, value );
            },

            property: function( name, value )
            {
                properties[ name ] = value;
                this.performDefault( name, value );
            },

            method: function( name, func, is_abstract )
            {
                var pre = prototype[ name ];

                if ( ( pre === undefined ) && is_abstract  )
                {
                    abstract_methods.push( name );
                }

                this.performDefault( name, func, is_abstract );
            },

            methodOverride: function( name, pre, func )
            {
                return util.overrideMethod(
                    name, pre, func, abstract_methods
                );
            },
        } );

        abstract_methods = util.arrayShrink( abstract_methods );

        // reference to the parent prototype (for more experienced users)
        prototype.parent = base.prototype;

        // set up the new class
        var new_class = create_ctor( abstract_methods );

        setup_props( new_class, abstract_methods );
        attach_prop_init( prototype, properties );

        new_class.prototype   = prototype;
        new_class.constructor = new_class;

        // lock down the new class (if supported) to ensure that we can't add
        // members at runtime
        util.freeze( new_class );

        // we're done with the extension process
        extending = false;

        return new_class;
    }


    /**
     * Creates the constructor for a new class
     *
     * This constructor will call the __constructor method for concrete classes
     * and throw an exception for abstract classes (to prevent instantiation).
     *
     * @param  {Array.<string>}  abstract_methods  list of abstract methods
     *
     * @return  {Function}  constructor
     */
    function create_ctor( abstract_methods )
    {
        // concrete class
        if ( abstract_methods.length === 0 )
        {
            var args = null;
            return function __self()
            {
                if ( !( this instanceof __self ) )
                {
                    // store arguments to be passed to constructor and
                    // instantiate new object
                    args = arguments;
                    return new __self();
                }

                this.__initProps();

                // call the constructor, if one was provided
                if ( this.__construct instanceof Function )
                {
                    // note that since 'this' refers to the new class (even
                    // subtypes), and since we're using apply with 'this', the
                    // constructor will be applied to subtypes without a problem
                    this.__construct.apply( this, ( args || arguments ) );
                    args = null;
                }
            };
        }
        // abstract class
        else
        {
            return function ()
            {
                if ( !extending )
                {
                    throw new Error( "Abstract classes cannot be instantiated" );
                }
            };
        }
    }
} )( false );


/**
 * Sets up common properties for the provided function (class)
 *
 * @param  {Function}        func              function (class) to set up
 * @param  {Array.<string>}  abstract_methods  list of abstract method names
 *
 * @return  {undefined}
 */
function setup_props( func, abstract_methods )
{
    attach_abstract( func, abstract_methods );
    attach_extend( func );
}


/**
 * Attaches __initProps() method to the class prototype
 *
 * The __initProps() method will initialize class properties for that instance,
 * ensuring that their data is not shared with other instances (this is not a
 * problem with primitive data types).
 *
 * The __initProps() method will also initialize any parent properties
 * (recursive) to ensure that subtypes do not have a referencing issue, and
 * subtype properties take precedence over those of the parent.
 *
 * @param  {Object}  prototype   prototype to attach method to
 * @param  {Object}  properties  properties to initialize
 *
 * @return  {undefined}
 */
function attach_prop_init( prototype, properties )
{
    util.defineSecureProp( prototype, '__initProps', function()
    {
        // first initialize the parent's properties, so that ours will overwrite
        // them
        var parent_init = prototype.parent.__initProps;
        if ( parent_init instanceof Function )
        {
            parent_init.call( this );
        }

        // initialize each of the properties for this instance to
        // ensure we're not sharing prototype values
        for ( prop in properties )
        {
            // initialize the value with a clone to ensure that they do
            // not share references (and therefore, data)
            this[ prop ] = util.clone( properties[ prop ] );
        }
    });
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
    util.defineSecureProp( func, 'isAbstract', function()
    {
        return is_abstract;
    });

    // attach the list of abstract methods to the class (make the copy of the
    // methods to ensure that they won't be gc'd or later modified and screw up
    // the value)
    util.defineSecureProp( func, 'abstractMethods', methods );
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
     * This method can be invoked on the object, rather than having to call
     * Class.extend( this ).
     *
     * @param  {Object}  props  properties to add to extended class
     *
     * @return  {Object}  extended class
     */
    util.defineSecureProp( func, 'extend', function( props )
    {
        return extend( this, props );
    });
}


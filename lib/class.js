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

    util.defineSecureProp( method, 'abstractFlag', true );
    util.defineSecureProp( method, 'definition', definition );

    return method;
}


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
    extending = false;

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

        // copy the given properties into the new prototype
        var result_data = {
            abstractMethods: ( base.abstractMethods || [] ).slice()
        };
        util.propCopy( props, prototype, result_data );

        // reference to the parent prototype (for more experienced users)
        prototype.parent = base.prototype;

        // set up the new class
        var new_class = create_ctor( result_data, extending );

        setup_props( new_class, result_data );
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
     * @param  {Object}  result_data  data from property copy operation
     *
     * @return  {Function}  constructor
     */
    function create_ctor( result_data )
    {
        // concrete class
        if ( result_data.abstractMethods.length === 0 )
        {
            return function()
            {
                if ( this.__construct instanceof Function )
                {
                    // call the constructor
                    this.__construct.apply( this, arguments );
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
} )();


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
     * This method can be invoked on the object, rater than having to call
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


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

var util           = require( './util' ),
    member_builder = require( './member_builder' );

/**
 * Stores class metadata internally (ensures data is encapsulated)
 *
 * The data in this object is hashed a class id.
 *
 * @type  {Object.<number, { implemented: Array.<string> }>}
 */
var class_meta = {};

/**
 * IE contains a nasty enumeration "bug" (poor implementation) that makes
 * toString unenumerable. This means that, if you do obj.toString = foo,
 * toString will NOT show up in `for` or hasOwnProperty(). This is a problem.
 *
 * This test will determine if this poor implementation exists.
 */
var enum_bug = (
        Object.prototype.propertyIsEnumerable.call(
            { toString: function() {} },
            'toString'
        ) === false
    )
    ? true
    : false
;


/**
 * This module may be invoked in order to provide a more natural looking class
 * definition mechanism
 *
 * This may not be used to extend existing classes. To extend an existing class,
 * use the class's extend() method. If unavailable (or extending a non-ease.js
 * class/object), use the module's extend() method.
 *
 * @param  {string=}  name  optional name
 * @param  {Object}   def   class definition
 *
 * @return  {Class}  new class
 */
module.exports = function()
{
    var type   = typeof arguments[ 0 ],
        result = null
    ;

    switch ( type )
    {
        // anonymous class
        case 'object':
            result = createAnonymousClass.apply( null, arguments );
            break;

        // named class
        case 'string':
            result = createNamedClass.apply( null, arguments );
            break;

        default:
            // we don't know what to do!
            throw TypeError(
                "Expecting anonymous class definition or named class definition"
            );
    }

    return result;
};


/**
 * Creates a class, inheriting either from the provided base class or the
 * default base class
 *
 * @param  {Object}  base  object to extend (extends Class by default)
 *
 * @return  {Object}  extended class
 */
module.exports.extend = function( base )
{
    return extend.apply( this, arguments );
};


/**
 * Implements an interface or set of interfaces
 *
 * @param  {...Interface}  interfaces  interfaces to implement
 *
 * @return  {Class}  new class containing interface abstractions
 */
module.exports.implement = function()
{
    // implement on empty base
    return createImplement(
        module.exports.extend(),
        Array.prototype.slice.call( arguments )
    );
};


/**
 * Determines whether the provided object is a class created through ease.js
 *
 * @param  {Object}  obj  object to test
 *
 * @return  {boolean}  true if class (created through ease.js), otherwise false
 */
module.exports.isClass = function( obj )
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
module.exports.isClassInstance = function( obj )
{
    obj = obj || {};

    return ( obj instanceof Class )
        ? true
        : false;
};


/**
 * Determines if the class is an instance of the given type
 *
 * The given type can be a class, interface, trait or any other type of object.
 * It may be used in place of the 'instanceof' operator and contains additional
 * enhancements that the operator is unable to provide due to prototypal
 * restrictions.
 *
 * @param  {Object}  type      expected type
 * @param  {Object}  instance  instance to check
 *
 * @return  {boolean}  true if instance is an instance of type, otherwise false
 */
module.exports.isInstanceOf = function( type, instance )
{
    var meta, implemented, i;

    try
    {
        // check prototype chain (with throw an error if type is not a
        // constructor (function)
        if ( instance instanceof type )
        {
            return true;
        }
    }
    catch ( e ) {}

    // if no metadata is available, then our remaining checks cannot be
    // performed
    if ( !instance.__cid || !( meta = getMeta( instance.__cid ) ) )
    {
        return false;
    }

    implemented = meta.implemented;
    i           = implemented.length;

    // check implemented interfaces
    while ( i-- )
    {
        if ( implemented[ i ] === type )
        {
            return true;
        }
    }

    return false;
};


/**
 * Alias for isInstanceOf()
 *
 * May read better in certain situations (e.g. Cat.isA( Mammal )) and more
 * accurately conveys the act of inheritance, implementing interfaces and
 * traits, etc.
 */
module.exports.isA = module.exports.isInstanceOf;


/**
 * Default class implementation
 *
 * @return undefined
 */
function Class() {};


/**
 * Creates a new anonymous Class from the given class definition
 *
 * @param  {Object}  def  class definition
 *
 * @return  {Class}  new anonymous class
 */
function createAnonymousClass( def )
{
    // ensure we have the proper number of arguments (if they passed in
    // too many, it may signify that they don't know what they're doing,
    // and likely they're not getting the result they're looking for)
    if ( arguments.length > 1 )
    {
        throw Error(
            "Expecting one argument for anonymous Class definition; " +
                arguments.length + " given."
        );
    }

    return extend( def );
}


/**
 * Creates a new named Class from the given class definition
 *
 * @param  {string}  name  class name
 * @param  {Object}  def   class definition
 *
 * @return  {Class}  new named class
 */
function createNamedClass( name, def )
{
    // if too many arguments were provided, it's likely that they're
    // expecting some result that they're not going to get
    if ( arguments.length > 2 )
    {
        throw Error(
            "Expecting two arguments for definition of named Class '" + name +
                "'; " + arguments.length + " given."
        );
    }

    // if no definition was given, return a staging object, to apply the name to
    // the class once it is actually created
    if ( def === undefined )
    {
        return createStaging( name );
    }
    // the definition must be an object
    else if ( typeof def !== 'object' )
    {
        throw TypeError(
            "Unexpected value for definition of named Class '" + name +
                "'; object expected"
        );
    }

    // add the name to the definition
    def.__name = name;

    return extend( def );
}


/**
 * Creates a staging object to stage a class name
 *
 * The class name will be applied to the class generated by operations performed
 * on the staging object. This allows applying names to classes that need to be
 * extended or need to implement interfaces.
 *
 * @param  {string}  cname  desired class name
 *
 * @return  {Object}  object staging the given class name
 */
function createStaging( cname )
{
    return {
        extend: function()
        {
            var args = Array.prototype.slice.apply( arguments );

            // extend() takes a maximum of two arguments. If only one
            // argument is provided, then it is to be the class definition.
            // Otherwise, the first argument is the supertype and the second
            // argument is the class definition. Either way you look at it,
            // the class definition is always the final argument.
            //
            // We want to add the name to the definition.
            args[ args.length - 1 ].__name = cname;

            return extend.apply( null, args );
        },

        implement: function()
        {
            // implement on empty base, providing the class name to be used once
            // extended
            return createImplement(
                extend( {} ),
                Array.prototype.slice.call( arguments ),
                cname
            );
        },
    };
}


/**
 * Creates an intermediate object to permit implementing interfaces
 *
 * This object defers processing until extend() is called. This intermediate
 * object ensures that a usable class is not generated until after extend() is
 * called, as it does not make sense to create a class without any
 * body/definition.
 *
 * @param  {Object}   base    base class to implement atop of
 * @param  {Array}    ifaces  interfaces to implement
 * @param  {string=}  cname   optional class name once extended
 *
 * @return  {Object}  intermediate implementation object
 */
function createImplement( base, ifaces, cname )
{
    ifaces.push( base );

    // Defer processing until after extend(). This also ensures that implement()
    // returns nothing usable.
    return {
        extend: function( def )
        {
            // if a name was provided, use it
            if ( cname )
            {
                def.__name = cname;
            }

            return extend.apply( null, [
                implement.apply( this, ifaces ),
                def
            ] );
        },
    };
}


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
    var class_id = 0;

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
            prototype = new base(),
            cname     = '',

            hasOwn = Array.prototype.hasOwnProperty;

        var properties       = {},
            members          = member_builder.initMembers(
                prototype, prototype, prototype
            ),

            abstract_methods =
                util.clone( getMeta( base.__cid ).abstractMethods )
                || { __length: 0 }
        ;

        // grab the name, if one was provided
        if ( cname = props.__name )
        {
            // we no longer need it
            delete props.__name;
        }

        // IE has problems with toString()
        if ( enum_bug )
        {
            if ( props.toString !== Object.prototype.toString )
            {
                props.__toString = props.toString;
            }
        }

        util.propParse( props, {
            each: function( name, value, keywords )
            {
                // disallow use of our internal __initProps() method
                if ( name === '__initProps' )
                {
                    throw new Error(
                        ( ( cname ) ? cname + '::' : '' ) +
                        "__initProps is a reserved method"
                    );
                }
            },

            property: function( name, value, keywords )
            {
                properties[ name ] = value;

                member_builder.buildProp(
                    members, null, name, value, keywords
                );
            },

            getter: function( name, value, keywords )
            {
                member_builder.buildGetter(
                    members, null, name, value, keywords
                );
            },

            setter: function( name, value, keywords )
            {
                member_builder.buildSetter(
                    members, null, name, value, keywords
                );
            },

            method: function( name, func, is_abstract, keywords )
            {
                member_builder.buildMethod(
                    members, null, name, func, keywords
                );

                if ( is_abstract )
                {
                    abstract_methods[ name ] = true;
                    abstract_methods.__length++;
                }
                else if ( ( hasOwn.call( abstract_methods, name ) )
                    && ( is_abstract === false )
                )
                {
                    // if this was a concrete method, then it should no longer
                    // be marked as abstract
                    delete abstract_methods[ name ];
                    abstract_methods.__length--;
                }
            },

            methodOverride: function( name, pre, func )
            {
                return util.overrideMethod(
                    name, pre, func, abstract_methods
                );
            },
        } );

        // reference to the parent prototype (for more experienced users)
        prototype.parent = base.prototype;

        // set up the new class
        var new_class = createCtor( cname, abstract_methods, members );

        attachPropInit( prototype, properties );

        new_class.prototype   = prototype;
        new_class.constructor = new_class;

        // important: call after setting prototype
        setupProps( new_class, abstract_methods, ++class_id );

        // lock down the new class (if supported) to ensure that we can't add
        // members at runtime
        util.freeze( new_class );

        // create internal metadata for the new class
        var meta = createMeta( new_class, base.prototype.__cid );
        meta.abstractMethods = abstract_methods;
        meta.name            = cname;

        // we're done with the extension process
        extending = false;

        return new_class;
    };


    /**
     * Creates the constructor for a new class
     *
     * This constructor will call the __constructor method for concrete classes
     * and throw an exception for abstract classes (to prevent instantiation).
     *
     * @param  {string}          cname             class name (may be empty)
     * @param  {Array.<string>}  abstract_methods  list of abstract methods
     * @param  {Object}          members           class members
     *
     * @return  {Function}  constructor
     */
    function createCtor( cname, abstract_methods, members )
    {
        // concrete class
        if ( abstract_methods.__length === 0 )
        {
            var args = null;

            var __self = function()
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

                // attach any instance properties/methods (done after
                // constructor to ensure they are not overridden)
                attachInstanceOf( this );

                // Provide a more intuitive string representation of the class
                // instance. If a toString() method was already supplied for us,
                // use that one instead.
                if ( !( Object.prototype.hasOwnProperty.call(
                    members[ 'public' ], 'toString'
                ) ) )
                {
                    // use __toString if available (see enum_bug), otherwise use
                    // our own defaults
                    this.toString = members[ 'public' ].__toString
                        || ( ( cname )
                            ? function()
                            {
                                return '[object #<' + cname + '>]';
                            }
                            : function()
                            {
                                return '[object #<anonymous>]';
                            }
                        )
                    ;
                }
            };

            // provide a more intuitive string representation
            __self.toString = ( cname )
                ? function() { return '[object Class <' + cname + '>]'; }
                : function() { return '[object Class]'; }
            ;

            return __self;
        }
        // abstract class
        else
        {
            var __abstract_self = function()
            {
                if ( !extending )
                {
                    throw Error(
                        "Abstract class " + ( cname || '(anonymous)' ) +
                            " cannot be instantiated"
                    );
                }
            };

            __abstract_self.toString = ( cname )
                ? function()
                {
                    return '[object AbstractClass <' + cname + '>]';
                }
                : function()
                {
                    return '[object AbstractClass]';
                }
            ;

            return __abstract_self;
        }
    }
} )( false );


/**
 * Implements interface(s) into an object
 *
 * This will copy all of the abstract methods from the interface and merge it
 * into the given object.
 *
 * @param  {Object}        base        base object
 * @param  {...Interface}  interfaces  interfaces to implement into dest
 *
 * @return  {Object}  destination object with interfaces implemented
 */
var implement = function()
{
    var args = Array.prototype.slice.call( arguments ),
        dest = {},
        base = args.pop(),
        len  = args.length,
        arg  = null,

        abstract_list = [],
        implemented   = [];

    // add each of the interfaces
    for ( var i = 0; i < len; i++ )
    {
        arg = args[ i ];

        // copy all interface methods to the class (does not yet deep copy)
        util.propParse( arg.prototype, {
            method: function( name, func, is_abstract, keywords )
            {
                dest[ name ] = func;
            },
        } );
        implemented.push( arg );
    }

    // create a new class with the implemented abstract methods
    var class_new = module.exports.extend( base, dest );
    getMeta( class_new.__cid ).implemented = implemented;

    return class_new;
}


/**
 * Sets up common properties for the provided function (class)
 *
 * @param  {function()}      func              function (class) to set up
 * @param  {Array.<string>}  abstract_methods  list of abstract method names
 * @param  {number}          class_id          unique id to assign to class
 *
 * @return  {undefined}
 */
function setupProps( func, abstract_methods, class_id )
{
    attachAbstract( func, abstract_methods );
    attachExtend( func );
    attachImplement( func );
    attachId( func, class_id );
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
function attachPropInit( prototype, properties )
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
function attachAbstract( func, methods )
{
    var is_abstract = ( methods.__length > 0 ) ? true: false;

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
}


/**
 * Attaches extend method to the given function (class)
 *
 * @param  {Function}  func  function (class) to attach method to
 *
 * @return  {undefined}
 */
function attachExtend( func )
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


/**
 * Attaches implement method to the given function (class)
 *
 * Please see the implement() export of this module for more information.
 *
 * @param  {function()}  func  function (class) to attach method to
 *
 * @return  {undefined}
 */
function attachImplement( func )
{
    util.defineSecureProp( func, 'implement', function()
    {
        return createImplement(
            func,
            Array.prototype.slice.call( arguments )
        );
    });
}


/**
 * Attaches the unique id to the class and its prototype
 *
 * The unique identifier is used internally to match a class and its instances
 * with the class metadata. Exposing the id breaks encapsulation to a degree,
 * but is a lesser evil when compared to exposing all metadata.
 *
 * @param  {Function}  func  function (class) to attach method to
 * @param  {number}    id    id to assign
 *
 * @return  {undefined}
 */
function attachId( func, id )
{
    util.defineSecureProp( func, '__cid', id );
    util.defineSecureProp( func.prototype, '__cid', id );
}


/**
 * Attaches partially applied isInstanceOf() method to class instance
 *
 * @param  {Object}  instance  class instance to attach method to
 *
 * @return  {undefined}
 */
function attachInstanceOf( instance )
{
    var method = function( type )
    {
        return module.exports.isInstanceOf( type, instance );
    };

    util.defineSecureProp( instance, 'isInstanceOf', method );
    util.defineSecureProp( instance, 'isA', method );
}


/**
 * Initializes class metadata for the given class
 *
 * @param  {Class}  func  class to initialize metadata for
 *
 * @return  {undefined}
 */
function createMeta( func, parent_id )
{
    var id          = func.__cid,
        parent_meta = ( ( parent_id ) ? getMeta( parent_id) : undefined );

    // copy the parent prototype's metadata if it exists (inherit metadata)
    if ( parent_meta )
    {
        class_meta[ id ] = util.clone( parent_meta, true );
    }
    else
    {
        // create empty
        class_meta[ id ] = {
            implemented: [],
        };
    }

    return class_meta[ id ];
}


/**
 * Returns reference to metadata for the requested class
 *
 * Since a reference is returned (rather than a copy), the returned object can
 * be modified to alter the metadata.
 *
 * @param  {number}  id  id of class to retrieve metadata for
 *
 * @return  {Object}
 */
function getMeta( id )
{
    return class_meta[ id ] || {};
}


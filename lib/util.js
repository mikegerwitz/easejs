/**
 * Contains utilities functions shared by modules
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

var propParseKeywords = require( __dirname + '/prop_parser' ).parseKeywords;


/**
 * Whether we can actually define properties, or we need to fall back
 *
 * This check actually attempts to set a property and fails if there's an error.
 * This is needed because IE8 has a broken implementation, yet still defines
 * Object.defineProperty for use with DOM elements. Just another day in the life
 * of a web developer.
 *
 * This test is only performed once, when the module is first loaded. Don't
 * expect a performance hit from it.
 *
 * @type  {boolean}
 */
var can_define_prop = ( function()
{
    if ( typeof Object.defineProperty === 'function' )
    {
        try
        {
            // perform test, primarily for IE8
            Object.defineProperty( {}, 'x', {} );
            return true;
        }
        catch ( e ) {}
    }

    return false;
} )();


/**
 * Freezes an object if freezing is supported
 *
 * @param  {Object}  obj  object to freeze
 *
 * @return  {Object}  object passed to function
 */
exports.freeze = ( typeof Object.freeze === 'function' )
    ? Object.freeze
    : function( obj )
    {
        return;
    }
;


/**
 * Gets/sets whether the system needs to fall back to defining properties in a
 * normal manner when use of Object.defineProperty() is requested
 *
 * This will be set by default if the JS engine does not support the
 * Object.defineProperty method from ECMAScript 5.
 *
 * @param  {boolean=}  val  value, if used as setter
 *
 * @return  {boolean|Object}  current value if getter, self if setter
 */
exports.definePropertyFallback = function( val )
{
    if ( val === undefined )
    {
        return !can_define_prop;
    }

    can_define_prop = !val;
    exports.defineSecureProp = getDefineSecureProp();

    return exports;
};


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
exports.defineSecureProp = getDefineSecureProp();


/**
 * Clones an object
 *
 * @param  {Object}   data  object to clone
 * @param  {boolean}  deep  perform deep clone (defaults to shallow)
 *
 * @return  {Object}  cloned object
 */
exports.clone = function clone( data, deep )
{
    deep = !!deep;

    if ( data instanceof Array )
    {
        if ( !deep )
        {
            // return a copy of the array
            return data.slice( 0 );
        }

        // if we're performing a deep clone, we have to loop through each of the
        // elements of the array and clone them
        var ret = [];
        for ( var i = 0, len = data.length; i < len; i++ )
        {
            // clone this element
            ret.push( clone( data[ i ], deep ) );
        }

        return ret;
    }
    else if ( typeof data === 'function' )
    {
        // It is pointless to clone a function. Even if we did clone those that
        // support toSource(), they'd still do the same damn thing.
        return data;
    }
    else if ( data instanceof Object )
    {
        var newobj = {},
            hasOwn = Object.prototype.hasOwnProperty;

        // copy data to the new object
        for ( prop in data )
        {
            if ( hasOwn.call( data, prop ) )
            {
                newobj[ prop ] = ( deep )
                    ? clone( data[ prop ] )
                    : data[ prop ]
                ;
            }
        }

        return newobj;
    }

    // primitive type; cloning unnecessary
    return data;
};


/**
 * Copies properties from one object to another
 *
 * This method is designed to support very basic object extensions. The
 * destination argument is first to allow extending an object without using the
 * full-blown class system.
 *
 * If a deep copy is not performed, all values will be copied by reference.
 *
 * @param  {Object}   dest  destination object
 * @param  {Object}   src   source object
 * @param  {boolean}  deep  perform deep copy (slower)
 *
 * @return  {Object}  dest
 */
exports.copyTo = function( dest, src, deep )
{
    deep = !!deep;

    var get, set, data;

    // sanity check
    if ( !( dest instanceof Object ) || !( src instanceof Object ) )
    {
        throw TypeError(
            "Must provide both source and destination objects"
        );
    }

    // slower; supports getters/setters
    if ( can_define_prop )
    {
        for ( prop in src )
        {
            data = Object.getOwnPropertyDescriptor( src, prop );

            if ( data.get || data.set )
            {
                // Define the property the slower way (only needed for
                // getters/setters). We don't have to worry about cloning in
                // this case, since getters/setters are methods.
                Object.defineProperty( dest, prop, data );
            }
            else
            {
                // normal copy; cloned if deep, otherwise by reference
                dest[ prop ] = ( deep )
                    ? exports.clone( src[ prop ], true )
                    : src[ prop ]
                ;
            }
        }
    }
    // quick (keep if statement out of the loop)
    else
    {
        for ( prop in src )
        {
            // normal copy; cloned if deep, otherwise by reference
            dest[ prop ] = ( deep )
                ? exports.clone( src[ prop ], true )
                : src[ prop ]
            ;
        }
    }

    // return dest for convenience (and to feel useful about ourselves)
    return dest;
};


/**
 * Parses object properties to determine how they should be interpreted in an
 * Object Oriented manner
 *
 * @param  {Object}  data     properties with names as the key
 * @param  {Object}  options  parser options and callbacks
 *
 * @return undefined
 */
exports.propParse = function( data, options )
{
    // todo: profile; function calls are more expensive than if statements, so
    // it's probably a better idea not to use fvoid
    var fvoid          = function() {},
        callbackEach   = options.each          || undefined,
        callbackProp   = options.property      || fvoid,
        callbackMethod = options.method        || fvoid,
        callbackGetSet = options.getset        || fvoid,
        keywordParser  = options.keywordParser || propParseKeywords,

        hasOwn = Object.prototype.hasOwnProperty,

        parse_data = {},
        name       = '',
        keywords   = {},
        value      = null,
        getter     = false,
        setter     = false;

    // for each of the given properties, determine what type of property we're
    // dealing with (in the classic OO sense)
    for ( prop in data )
    {
        // ignore properties of instance prototypes
        if ( !( hasOwn.call( data, prop ) ) )
        {
            continue;
        }

        // retrieve getters/setters, if supported
        if ( can_define_prop )
        {
            var prop_desc = Object.getOwnPropertyDescriptor( data, prop );
            getter = prop_desc.get;
            setter = prop_desc.set;
        }

        value  = data[ prop ];

        parse_data = keywordParser( prop ) || {};
        name       = parse_data.name || prop;
        keywords   = parse_data.keywords || {};

        if ( keywords['abstract'] )
        {
            if ( !( value instanceof Array ) )
            {
                throw TypeError(
                    "Missing parameter list for abstract method: " + name
                );
            }

            value = exports.createAbstractMethod.apply( this, value );
        }

        // if an 'each' callback was provided, pass the data before parsing it
        if ( callbackEach )
        {
            callbackEach.call( callbackEach, name, value, keywords );
        }

        // getter/setter
        if ( getter || setter )
        {
            callbackGetSet.call( callbackGetSet,
                name, getter, setter, keywords
            );
        }
        // method
        else if ( typeof value === 'function' )
        {
            callbackMethod.call(
                callbackMethod,
                name,
                value,
                exports.isAbstractMethod( value ),
                keywords
            );
        }
        // simple property
        else
        {
            callbackProp.call( callbackProp, name, value, keywords );
        }
    }
};


/**
 * Creates an abstract method
 *
 * Abstract methods must be implemented by a subclass and cannot be called
 * directly. If a class contains a single abstract method, the class itself is
 * considered to be abstract and cannot be instantiated. It may only be
 * extended.
 *
 * @param  {...string}  definition  function definition that concrete
 *                                  implementations must follow
 *
 * @return  {Function}
 */
exports.createAbstractMethod = function()
{
    var definition = Array.prototype.slice.call( arguments );

    var method = function()
    {
        throw new Error( "Cannot call abstract method" );
    };

    exports.defineSecureProp( method, 'abstractFlag', true );
    exports.defineSecureProp( method, 'definition', definition );
    exports.defineSecureProp( method, '__length', arguments.length );

    return method;
};


/**
 * Determines if the given function is an abstract method
 *
 * @param  {Function}  function  function to inspect
 *
 * @return  {boolean}  true if function is an abstract method, otherwise false
 */
exports.isAbstractMethod = function( func )
{
    return ( ( typeof func === 'function') && ( func.abstractFlag === true ) )
        ? true
        : false
    ;
};


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
exports.arrayShrink = function( items )
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
};


/**
 * Uses Object.getOwnPropertyDescriptor if available, otherwise provides our own
 * implementation to fall back on
 *
 * If the environment does not support retrieving property descriptors (ES5),
 * then the following will be true:
 *  - get/set will always be undefined
 *  - writable, enumerable and configurable will always be true
 *  - value will be the value of the requested property on the given object
 *
 * @param  {Object}  obj   object to check property on
 * @param  {string}  prop  property to retrieve descriptor for
 *
 * @return  {Object}  descriptor for requested property or undefined if not found
 */
exports.getOwnPropertyDescriptor =
    ( can_define_prop && Object.getOwnPropertyDescriptor )
    || function( obj, prop )
    {
        if ( !Object.prototype.hasOwnProperty.call( obj, prop ) )
        {
            return undefined;
        }

        // fallback response
        return {
            get: undefined,
            set: undefined,

            writable:     true,
            enumerable:   true,
            configurable: true,

            value: obj[ prop ],
        };
    };


/**
 * Travels down the prototype chain of the given object in search of the
 * requested property and returns its descriptor
 *
 * This operates as Object.getOwnPropertyDescriptor(), except that it traverses
 * the prototype chain. For environments that do not support __proto__, it will
 * not traverse the prototype chain and essentially serve as an alias for
 * getOwnPropertyDescriptor().
 *
 * This method has the option to ignore the base prototype. This is useful to,
 * for example, not catch properties like Object.prototype.toString() when
 * searching for 'toString' on an object.
 *
 * @param  {Object}  obj     object to check property on
 * @param  {string}  prop    property to retrieve descriptor for
 * @param  {bool}    nobase  whether to ignore the base prototype
 *
 * @return  {Object}  descriptor for requested property or undefined if not found
 */
exports.getPropertyDescriptor = function( obj, prop, nobase )
{
    // false by default
    nobase = !!nobase;

    // note that this uses util's function, not Object's
    var desc = exports.getOwnPropertyDescriptor( obj, prop ),
        next = obj.__proto__;

    // if we didn't find a descriptor and a prototype is available, recurse down
    // the prototype chain, ensuring that the next prototype has a prototype if
    // the base is to be excluded
    if ( !desc && next && ( !nobase || next.__proto__ ) )
    {
        return exports.getPropertyDescriptor( obj.__proto__, prop, nobase );
    }

    // return the descriptor or undefined if no prototype is available
    return desc;
};


/**
 * Indicates whether or not the getPropertyDescriptor method is capable of
 * traversing the prototype chain
 *
 * @type  {boolean}
 */
exports.defineSecureProp( exports.getPropertyDescriptor, 'canTraverse',
    ( {}.__proto__ ) ? true : false
);


/**
 * Appropriately returns defineSecureProp implementation to avoid check on each
 * invocation
 *
 * @return  {function( Object, string, * )}
 */
function getDefineSecureProp()
{
    // falls back to simply defining a normal property
    var fallback = function( obj, prop, value )
    {
        obj[ prop ] = value;
    };

    if ( !can_define_prop )
    {
        return fallback;
    }
    else
    {
        // uses ECMAScript 5's Object.defineProperty() method
        return function( obj, prop, value )
        {
            try
            {
                Object.defineProperty( obj, prop,
                {
                    value: value,

                    enumerable:   false,
                    writable:     false,
                    configurable: false,
                });
            }
            catch ( e )
            {
                // let's not have this happen again, as repeatedly throwing
                // exceptions will do nothing but slow down the system
                exports.definePropertyFallback( true );

                // if there's an error (ehem, IE8), fall back
                fallback( obj, prop, value );
            }
        };
    }
}


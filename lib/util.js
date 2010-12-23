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


/**
 * Whether getters/setters are supported
 * @var  {boolean}
 */
var getset = ( Object.prototype.__defineGetter__ === undefined )
    ? false
    : true
;

/**
 * Whether we can actually define secure properties, or we need to fall back
 * @type  {boolean}
 */
var secure_fallback = ( Object.defineProperty instanceof Function )
    ? false
    : true;


/**
 * Freezes an object if freezing is supported
 *
 * @param  {Object}  obj  object to freeze
 *
 * @return  {Object}  object passed to function
 */
exports.freeze = function( obj )
{
    // if freezing is not supported (ES5), do nothing
    if ( Object.freeze === undefined )
    {
        return;
    }

    Object.freeze( obj );
    return obj;
}


/**
 * Gets/sets whether the system needs to fall back to defining normal properties
 * when a secure property is requested
 *
 * This will be set by default if the JS engine does not support the
 * Object.defineProperty method from EcmaScript 5.
 *
 * @param  {boolean=}  val  value, if used as setter
 *
 * @return  {boolean|Object}  current value if getter, self if setter
 */
exports.secureFallback = function( val )
{
    if ( val === undefined )
    {
        return secure_fallback;
    }

    secure_fallback = !!val;
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
 * @param  {Object}  data  object to clone
 *
 * @return  {Object}  cloned object
 */
exports.clone = function( data )
{
    if ( data instanceof Array )
    {
        // return a copy of the array
        return data.slice( 0 );
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
                newobj[ prop ] = data[ prop ];
            }
        }

        return newobj;
    }

    // primitive type; cloning unnecessary
    return data;
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
    var fvoid           = function() {},
        callback_each   = options.each     || undefined,
        callback_prop   = options.property || fvoid,
        callback_method = options.method   || fvoid,
        callback_getter = options.getter   || fvoid,
        callback_setter = options.setter   || fvoid,

        hasOwn = Object.prototype.hasOwnProperty;

    // for each of the given properties, determine what type of property we're
    // dealing with (in the classic OO sense)
    for ( prop in data )
    {
        // ignore properties of instance prototypes
        if ( !( hasOwn.call( data, prop ) ) )
        {
            continue;
        }

        var value = data[ prop ],
            getter = ( ( getset ) ? data.__lookupGetter__( prop ) : null ),
            setter = ( ( getset ) ? data.__lookupSetter__( prop ) : null );

        // if an 'each' callback was provided, pass the data before parsing it
        if ( callback_each )
        {
            callback_each.call( callback_each, prop, value );
        }

        // getter/setter
        if ( getter || setter )
        {
            callback_getter.call( callback_getter, prop, getter );
            callback_setter.call( callback_setter, prop, setter );
        }
        // method
        else if ( value instanceof Function )
        {
            callback_method.call(
                callback_method,
                prop,
                value,
                exports.isAbstractMethod( value )
            );
        }
        // simple property
        else
        {
            callback_prop.call( callback_prop, prop, value );
        }
    }
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
 * @param  {Object}  props    properties to copy
 * @param  {Object}  dest     destination object
 * @param  {Object}  actions  parser actions (see propParse())
 *
 * @return undefined
 */
exports.propCopy = function( props, dest, actions )
{
    actions     = actions || {};

    var use_or = function( use, or )
    {
        if ( use instanceof Function )
        {
            // allow the override to invoke the default implementation
            use.performDefault = or;
            return use;
        }

        // use the default
        return or;
    };

    // substitute default functionality if needed
    var parse_actions = {
        each: use_or( actions.each, function( name, value )
        {
            // methods can only be overridden with methods
            if ( ( dest[ name ] instanceof Function )
                && ( !( value instanceof Function ) )
            )
            {
                throw new TypeError( "Cannot override method with non-method" );
            }
        } ),

        property: use_or( actions.property, function( name, value )
        {
            dest[ name ] = value;
        } ),

        getter: use_or( actions.getter, function( name, func )
        {
            dest.__defineGetter__( name, func );
        } ),

        setter: use_or( actions.setter, function( name, func )
        {
            dest.__defineSetter__( name, func );
        } ),

        method: use_or( actions.method, function( name, func, is_abstract )
        {
            var pre = dest[ name ];

            // check for override
            if ( pre !== undefined )
            {
                if ( pre instanceof Function )
                {
                    // use provided method override action, or fall back to
                    // generic override
                    var override_func = use_or( actions.methodOverride,
                        function( name, pre, func )
                        {
                            return exports.overrideMethod( name, pre, func );
                        }
                    );

                    // use call(), passing self in as context, to ensure 'this'
                    // will reference the function itself
                    dest[ name ] = override_func.call(
                        override_func, name, pre, func
                    );
                }
                else
                {
                    throw new TypeError(
                        "Cannot override property '" + name + "' with method"
                    );
                }
            }
            else
            {
                // simply copy over the method
                dest[ name ] = func;
            }
        } ),
    };

    exports.propParse( props, parse_actions );
}


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

    return method;
}


/**
 * Determines if the given function is an abstract method
 *
 * @param  {Function}  function  function to inspect
 *
 * @return  {boolean}  true if function is an abstract method, otherwise false
 */
exports.isAbstractMethod = function( func )
{
    return ( ( func instanceof Function ) && ( func.abstractFlag === true ) )
        ? true
        : false
    ;
}


/**
 * Overrides a method
 *
 * The given method must be a function or an exception will be thrown.
 *
 * @param  {string}           name              method name
 * @param  {Function}         super_method      method to override
 * @param  {Function}         new_method        method to override with
 * @param  {Array.<string>=}  abstract_methods  list of abstract methods
 *
 * @return  {Function}  overridden method
 */
exports.overrideMethod = function(
    name, super_method, new_method, abstract_methods
)
{
    abstract_methods = abstract_methods || [];

    // it's much faster to lookup a hash than it is to iterate through an entire
    // array each time we need to find an existing abstract method
    var abstract_map = {};
    for ( var i = 0, len = abstract_methods.length; i < len; i++ )
    {
        var method = abstract_methods[ i ];
        abstract_map[ method ] = i;
    }

    if ( abstract_map[ name ] !== undefined )
    {
        var is_abstract = exports.isAbstractMethod( new_method );

        if ( super_method.definition instanceof Array )
        {
            var arg_len = ( is_abstract )
                ? new_method.definition.length
                : new_method.length;

            // ensure the concrete definition is compatible with
            // that of its supertype
            if ( arg_len < super_method.definition.length )
            {
                throw new TypeError(
                    "Declaration of " + name + " must be compatiable " +
                        "with that of its supertype"
                );
            }
        }

        // if this was a concrete method, then it should no longer be marked as
        // abstract
        if ( is_abstract === false )
        {
            delete abstract_methods[ abstract_map[ name ] ];
        }
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
        var retval   = new_method.apply( this, arguments );
        this.__super = tmp;

        return retval;
    }
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
}


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

    if ( secure_fallback )
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
                exports.secureFallback( true );

                // if there's an error (ehem, IE8), fall back
                fallback( obj, prop, value );
            }
        };
    }
}


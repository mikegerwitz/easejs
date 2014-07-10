/**
 * Contains basic inheritance mechanism
 *
 *  Copyright (C) 2010, 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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
 * Console to use for logging
 *
 * This reference allows an alternative console to be used. Must contain
 * warn() or log() methods.
 *
 * TODO: This needs to be moved into a facade, once more refactoring can be
 * done; it was moved out of warn during its refactoring.
 *
 * @type {Object}
 */
var _console = ( typeof console !== 'undefined' ) ? console : undefined;

var util         = require( './util' ),
    ClassBuilder = require( './ClassBuilder' ),

    warn        = require( './warn' ),
    Warning     = warn.Warning,
    log_handler = warn.LogHandler( _console ),

    MethodWrapperFactory = require( './MethodWrapperFactory' ),
    wrappers             = require( './MethodWrappers' ).standard,

    class_builder = ClassBuilder(
        log_handler,
        require( './MemberBuilder' )(
            MethodWrapperFactory( wrappers.wrapNew ),
            MethodWrapperFactory( wrappers.wrapOverride ),
            MethodWrapperFactory( wrappers.wrapProxy ),
            require( './MemberBuilderValidator' )(
                function( warning )
                {
                    log_handler.handle( Warning( warning ) );
                }
            )
        ),
        require( './VisibilityObjectFactoryFactory' )
            .fromEnvironment()
    )
;

var _nullf = function() { return null; }


/**
 * This module may be invoked in order to provide a more natural looking class
 * definition mechanism
 *
 * This may not be used to extend existing classes. To extend an existing class,
 * use the class's extend() method. If unavailable (or extending a non-ease.js
 * class/object), use the module's extend() method.
 *
 * @param  {string|Object}  namedef  optional name or definition
 * @param  {Object=}        def      class definition if first argument is name
 *
 * @return  {Function|Object}  new class or staging object
 */
module.exports = function( namedef, def )
{
    var type   = ( typeof namedef ),
        result = null,
        args   = [],
        i      = arguments.length
    ;

    // passing arguments object prohibits optimizations in v8
    while ( i-- ) args[ i ] = arguments[ i ];

    switch ( type )
    {
        // anonymous class
        case 'object':
            result = createAnonymousClass.apply( null, args );
            break;

        // named class
        case 'string':
            result = createNamedClass.apply( null, args );
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
 * @param  {Function|Object}  baseordfn   parent or definition object
 * @param  {Object=}          dfn         definition object if parent provided
 *
 * @return  {Function}  extended class
 */
module.exports.extend = extend;


/**
 * Implements an interface or set of interfaces
 *
 * @param  {...Function}  interfaces  interfaces to implement
 *
 * @return  {Object}  intermediate interface object
 */
module.exports.implement = function( interfaces )
{
    // implement on empty base
    return createImplement(
        null,
        Array.prototype.slice.call( arguments )
    );
};


/**
 * Mix a trait into a class
 *
 * The ultimate intent of this depends on the ultimate `extend' call---if it
 * extends another class, then the traits will be mixed into that class;
 * otherwise, the traits will be mixed into the base class. In either case,
 * a final `extend' call is necessary to complete the definition. An attempt
 * to instantiate the return value before invoking `extend' will result in
 * an exception.
 *
 * @param  {Array.<Function>}  traits  traits to mix in
 *
 * @return  {Function}  staging object for class definition
 */
module.exports.use = function( traits )
{
    var args = [], i = arguments.length;
    while( i-- ) args[ i ] = arguments[ i ];

    // consume traits onto an empty base
    return createUse( _nullf, args );
};


var _dummyclass = { prototype: {} };
var _dummyinst  = { constructor: { prototype: {} } };

/**
 * Determines whether the provided object is a class created through ease.js
 *
 * TODO: delegate to ClassBuilder
 *
 * @param  {Object}  obj  object to test
 *
 * @return  {boolean}  true if class (created through ease.js), otherwise false
 */
module.exports.isClass = function( obj )
{
    obj = obj || _dummyclass;

    if ( !obj.prototype )
    {
        return false;
    }

    var meta = ClassBuilder.getMeta( obj );

    // TODO: we're checking a random field on the meta object; do something
    // proper
    return ( ( ( meta !== null ) && meta.implemented )
        || ( obj.prototype instanceof ClassBuilder.ClassBase ) )
        ? true
        : false
    ;
};


/**
 * Determines whether the provided object is an instance of a class created
 * through ease.js
 *
 * TODO: delegate to ClassBuilder
 *
 * @param  {Object}  obj  object to test
 *
 * @return  {boolean}  true if instance of class (created through ease.js),
 *                     otherwise false
 */
module.exports.isClassInstance = function( obj )
{
    obj = obj || _dummyinst;

    // if the constructor is a class, then we must be an instance!
    return module.exports.isClass( obj.constructor );
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
module.exports.isInstanceOf = ClassBuilder.isInstanceOf;


/**
 * Alias for isInstanceOf()
 *
 * May read better in certain situations (e.g. Cat.isA( Mammal )) and more
 * accurately conveys the act of inheritance, implementing interfaces and
 * traits, etc.
 */
module.exports.isA = module.exports.isInstanceOf;


/**
 * Creates a new anonymous Class from the given class definition
 *
 * @param  {Object}  def  class definition
 *
 * @return  {Function}  new anonymous class
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
 * @return  {Function|Object}  new named class or staging object if definition
 *                             was not provided
 */
function createNamedClass( name, def )
{
    // if too many arguments were provided, it's likely that they're
    // expecting some result that they're not going to get
    if ( arguments.length > 2 )
    {
        throw Error(
            "Expecting at most two arguments for definition of named Class '" +
                name + "'; " + arguments.length + " given."
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
            var args = [],
                i    = arguments.length;

            while ( i-- ) args[ i ] = arguments[ i ];

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
            var args = [],
                i    = arguments.length;

            while ( i-- ) args[ i ] = arguments[ i ];

            // implement on empty base, providing the class name to be used once
            // extended
            return createImplement( null, args, cname );
        },

        use: function()
        {
            var args = [],
                i    = arguments.length;

            while ( i-- ) args[ i ] = arguments[ i ];

            return createUse( _nullf, args );
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
 * @param  {Object}   base    base class to implement atop of, or null
 * @param  {Array}    ifaces  interfaces to implement
 * @param  {string=}  cname   optional class name once extended
 *
 * @return  {Object}  intermediate implementation object
 */
function createImplement( base, ifaces, cname )
{
    // Defer processing until after extend(). This also ensures that implement()
    // returns nothing usable.
    var partial = {
        extend: function()
        {
            var an       = arguments.length,
                def      = arguments[ an - 1 ],
                ext_base = ( an > 1 ) ? arguments[ an - 2 ] : null
            ;

            // if any arguments remain, then they likely misunderstood what this
            // method does
            if ( an > 2 )
            {
                throw Error(
                    "Expecting no more than two arguments for extend()"
                );
            }

            // if a base was already provided for extending, don't allow them to
            // give us yet another one (doesn't make sense)
            if ( base && ext_base )
            {
                throw Error(
                    "Cannot override parent " + base.toString() + " with " +
                    ext_base.toString() + " via extend()"
                );
            }

            // if a name was provided, use it
            if ( cname )
            {
                def.__name = cname;
            }

            // If a base was provided when createImplement() was called, use
            // that. Otherwise, use the extend() base passed to this function.
            // If neither of those are available, extend from an empty class.
            ifaces.push( base || ext_base || extend( {} ) );

            return extend.call( null,
                implement.apply( this, ifaces ),
                def
            );
        },

        // TODO: this is a naive implementation that works, but could be
        // much more performant (it creates a subtype before mixing in)
        use: function()
        {
            var traits = [],
                i      = arguments.length;

            // passing arguments object prohibits optimizations in v8
            while ( i-- ) traits[ i ] = arguments[ i ];

            return createUse(
                function() { return partial.__createBase(); },
                traits
            );
        },

        // allows overriding default behavior
        __createBase: function()
        {
            return partial.extend( {} );
        },
    };

    return partial;
}


/**
 * Create a staging object representing an eventual mixin
 *
 * This staging objects prepares a class definition for trait mixin. In
 * particular, the returned staging object has the following features:
 *   - invoking it will, if mixing into an existing (non-base) class without
 *     subclassing, immediately complete the mixin and instantiate the
 *     generated class;
 *   - calling `use' has the effect of chaining mixins, stacking them atop
 *     of one-another; and
 *   - invoking `extend' will immediately complete the mixin, resulting in a
 *     subtype of the base.
 *
 * Mixins are performed lazily---the actual mixin will not take place until
 * the final `extend' call, which may be implicit by invoking the staging
 * object (performing instantiation).
 *
 * The third argument determines whether or not a final `extend' call must
 * be explicit: in this case, any instantiation attempts will result in an
 * exception being thrown.
 *
 * @param  {function()}        basef    returns base from which to lazily
 *                                       extend
 * @param  {Array.<Function>}  traits   traits to mix in
 * @param  {boolean}           nonbase  extending from a non-base class
 *                                       (setting will permit instantiation
 *                                       with implicit extend)
 *
 * @return  {Function}  staging object for mixin
 */
function createUse( basef, traits, nonbase )
{
    // invoking the partially applied class will immediately complete its
    // definition and instantiate it with the provided constructor arguments
    var partial = function()
    {
        // this argument will be set only in the case where an existing
        // (non-base) class is extended, meaning that an explict Class or
        // AbstractClass was not provided
        if ( !( nonbase ) )
        {
            throw TypeError(
                "Cannot instantiate incomplete class definition; did " +
                "you forget to call `extend'?"
            );
        }

        return createMixedClass( basef(), traits )
            .apply( null, arguments );
    };


    // otherwise, its definition is deferred until additional context is
    // given during the extend operation
    partial.extend = function()
    {
        var an       = arguments.length,
            dfn      = arguments[ an - 1 ],
            ext_base = ( an > 1 ) ? arguments[ an - 2 ] : null,
            base     = basef();

        // extend the mixed class, which ensures that all super references
        // are properly resolved
        return extend.call( null,
            createMixedClass( ( base || ext_base ), traits ),
            dfn
        );
    };

    // syntatic sugar to avoid the aruduous and seemingly pointless `extend'
    // call simply to mix in another trait
    partial.use = function()
    {
        var args = [],
            i    = arguments.length;

        while ( i-- ) args[ i ] = arguments[ i ];

        return createUse(
            function()
            {
                return partial.__createBase();
            },
            args,
            nonbase
        );
    };

    // allows overriding default behavior
    partial.__createBase = function()
    {
        return partial.extend( {} );
    };

    return partial;
}


function createMixedClass( base, traits )
{
    // generated definition for our [abstract] class that will mix in each
    // of the provided traits; it will automatically be marked as abstract
    // if needed
    var dfn = { ___$$auto$abstract$$: true };

    // this object is used as a class-specific context for storing trait
    // data; it will be encapsulated within a ctor closure and will not be
    // attached to any class
    var tc = [];

    // "mix" each trait into the class definition object
    for ( var i = 0, n = traits.length; i < n; i++ )
    {
        traits[ i ].__mixin( dfn, tc, ( base || ClassBuilder.ClassBase ) );
    }

    // create the mixed class from the above generated definition
    var C    = extend.call( null, base, dfn ),
        meta = ClassBuilder.getMeta( C );

    // add each trait to the list of implemented types so that the
    // class is considered to be of type T in traits
    var impl = meta.implemented;
    for ( var i = 0, n = traits.length; i < n; i++ )
    {
        impl.push( traits[ i ] );
        traits[ i ].__mixinImpl( impl );
    }

    return C;
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
 * @param  {Function|Object}  _   parent or definition object
 * @param  {Object=}          __  definition object if parent was provided
 *
 * @return  {Function}  extended class
 */
function extend( _, __ )
{
    var args = [],
        i    = arguments.length;

    // passing arguments object prohibits optimizations in v8
    while ( i-- ) args[ i ] = arguments[ i ];

    // set up the new class
    var new_class = class_builder.build.apply( class_builder, args );

    // set up some additional convenience props
    setupProps( new_class );

    // lock down the new class (if supported) to ensure that we can't add
    // members at runtime
    util.freeze( new_class );

    return new_class;
}


/**
 * Implements interface(s) into an object
 *
 * This will copy all of the abstract methods from the interface and merge it
 * into the given object.
 *
 * @param  {Object}       baseobj     base object
 * @param  {...Function}  interfaces  interfaces to implement into dest
 *
 * @return  {Object}  destination object with interfaces implemented
 */
var implement = function( baseobj, interfaces )
{
    var an   = arguments.length,
        dest = {},
        base = arguments[ an - 1 ],
        arg  = null,

        implemented   = [],
        make_abstract = false
    ;

    // add each of the interfaces
    for ( var i = 0; i < ( an - 1 ); i++ )
    {
        arg = arguments[ i ];

        // copy all interface methods to the class (does not yet deep copy)
        util.propParse( arg.prototype, {
            method: function( name, func, is_abstract, keywords )
            {
                dest[ 'abstract ' + name ] = func.definition;
                make_abstract = true;
            },
        } );
        implemented.push( arg );
    }

    // xxx: temporary
    if ( make_abstract )
    {
        dest.___$$abstract$$ = true;
    }

    // create a new class with the implemented abstract methods
    var class_new = module.exports.extend( base, dest );
    ClassBuilder.getMeta( class_new ).implemented = implemented;

    return class_new;
}


/**
 * Sets up common properties for the provided function (class)
 *
 * @param  {function()}  func  function (class) to set up
 *
 * @return  {undefined}
 */
function setupProps( func )
{
    attachExtend( func );
    attachImplement( func );
    attachUse( func );
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
        var args = [], i = arguments.length;
        while( i-- ) args[ i ] = arguments[ i ];

        return createImplement( func, args );
    });
}


/**
 * Attaches use method to the given function (class)
 *
 * Please see the `use' export of this module for more information.
 *
 * @param  {function()}  func  function (class) to attach method to
 *
 * @return  {undefined}
 */
function attachUse( func )
{
    util.defineSecureProp( func, 'use', function()
    {
        var args = [], i = arguments.length;
        while( i-- ) args[ i ] = arguments[ i ];

        return createUse( function() { return func; }, args, true );
    } );
}


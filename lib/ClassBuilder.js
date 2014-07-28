/**
 * Handles building of classes
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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
 *
 * TODO: This module is currently being tested /indirectly/ by the class
 *       tests. This is because of a refactoring. All of this logic used to
 *       be part of the class module. Test this module directly, but keep
 *       the existing class tests in tact for a higher-level test.
 */

var util    = require( './util' ),
    Warning = require( './warn' ).Warning,
    Symbol  = require( './util/Symbol' ),

    hasOwn = Object.prototype.hasOwnProperty,


    /**
     * IE contains a nasty enumeration "bug" (poor implementation) that makes
     * toString unenumerable. This means that, if you do obj.toString = foo,
     * toString will NOT show up in `for` or hasOwnProperty(). This is a problem.
     *
     * This test will determine if this poor implementation exists.
     */
    enum_bug = (
        Object.prototype.propertyIsEnumerable.call(
            { toString: function() {} },
            'toString'
        ) === false
    )
    ? true
    : false,

    /**
     * Hash of reserved members
     *
     * These methods cannot be defined in the class. They are for internal use
     * only. We must check both properties and methods to ensure that neither is
     * defined.
     *
     * @type {Object.<string,boolean>}
     */
    reserved_members = {
        '__initProps': true,
        'constructor': true,
    },

    /**
     * Hash of methods that must be public
     *
     * Notice that this is a list of /methods/, not members, because this check
     * is performed only for methods. This is for performance reasons. We do not
     * have a situation where we will want to check for properties as well.
     *
     * @type {Object.<string,boolean>}
     */
    public_methods = {
        '__construct': true,
        '__mixin':     true,
        'toString':    true,
        '__toString':  true,
    },

    /**
     * Symbol used to encapsulate internal data
     *
     * Note that this is intentionally generated *outside* the ClassBuilder
     * instance; this ensures that it is properly encapsulated and will not
     * be exposed on the Classbuilder instance (which would defeat the
     * purpose).
     */
    _priv = Symbol()
;


/**
 * Initializes class builder with given member builder
 *
 * The 'new' keyword is not required when instantiating this constructor.
 *
 * @param  {Object}  member_builder  member builder
 *
 * @param  {VisibilityObjectFactory}  visibility_factory  visibility object
 *                                                        generator
 *
 * @constructor
 */
module.exports = exports =
function ClassBuilder( warn_handler, member_builder, visibility_factory )
{
    // allow ommitting the 'new' keyword
    if ( !( this instanceof exports ) )
    {
        // module.exports for Closure Compiler
        return new module.exports(
            warn_handler, member_builder, visibility_factory
        );
    }

    /**
     * Determines how warnings should be handled
     * @type {WarningHandler}
     */
    this._warnHandler = warn_handler;

    /**
     * Used for building class members
     * @type {Object}
     */
    this._memberBuilder = member_builder;

    /**
     * Generates visibility object
     * @type {VisibilityObjectFactory}
     */
    this._visFactory = visibility_factory;


    /**
     * Class id counter, to be increment on each new definition
     * @type {number}
     */
    this._classId = 0;

    /**
     * Instance id counter, to be incremented on each new instance
     * @type {number}
     */
    this._instanceId = 0;

    /**
     * Set to TRUE when class is in the process of being extended to ensure that
     * a constructor can be instantiated (to use as the prototype) without
     * invoking the class construction logic
     *
     * @type {boolean}
     */
    this._extending = false;

    /**
     * A flag to let the system know that we are currently attempting to access
     * a static property from within a method. This means that the caller should
     * be given access to additional levels of visibility.
     *
     * @type {boolean}
     */
    this._spropInternal = false;
};


/**
 * Default class implementation
 *
 * @return undefined
 */
exports.ClassBase = function Class() {};

// the base class has the class identifier 0
util.defineSecureProp( exports.ClassBase, '__cid', 0 );


/**
 * Default static property method
 *
 * This simply returns undefined, signifying that the property was not found.
 *
 * @param  {string}  prop  requested property
 *
 * @return  {undefined}
 */
exports.ClassBase.$ = function( prop, val )
{
    if ( val !== undefined )
    {
        throw ReferenceError(
            "Cannot set value of undeclared static property '" + prop + "'"
        );
    }

    return undefined;
};


/**
 * Returns a hash of the reserved members
 *
 * The returned object is a copy of the original. It cannot be used to modify
 * the internal list of reserved members.
 *
 * @return  {Object.<string,boolean>}  reserved members
 */
exports.getReservedMembers = function()
{
    // return a copy of the reserved members
    return util.clone( reserved_members, true );
};


/**
 * Returns a hash of the forced-public methods
 *
 * The returned object is a copy of the original. It cannot be used to modify
 * the internal list of reserved members.
 *
 * @return  {Object.<string,boolean>}  forced-public methods
 */
exports.getForcedPublicMethods = function()
{
    return util.clone( public_methods, true );
};


/**
 * Returns reference to metadata for the requested class
 *
 * Since a reference is returned (rather than a copy), the returned object can
 * be modified to alter the metadata.
 *
 * @param  {Function|Object}  cls  class from which to retrieve metadata
 *
 * @return  {__class_meta} or null if unavailable
 */
exports.getMeta = function( cls )
{
    return ( cls[ _priv ] || {} ).meta || null;
}


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
exports.isInstanceOf = function( type, instance )
{
    var meta, implemented, i;

    if ( !( type && instance ) )
    {
        return false;
    }

    // defer check to type, falling back to a more primitive check; this
    // also allows extending ease.js' type system
    return !!( type.__isInstanceOf || _instChk )( type, instance );
}


/**
 * Wrapper around ECMAScript instanceof check
 *
 * This will not throw an error if TYPE is not a function.
 *
 * Note that a try/catch is used instead of checking first to see if TYPE is
 * a function; this is due to the implementation of, notably, IE, which
 * allows instanceof to be used on some DOM objects with typeof `object'.
 * These same objects have typeof `function' in other browsers.
 *
 * @param  {*}       type      constructor to check against
 * @param  {Object}  instance  instance to examine
 *
 * @return  {boolean}  whether INSTANCE is an instance of TYPE
 */
function _instChk( type, instance )
{
    try
    {
        // check prototype chain (will throw an error if type is not a
        // constructor)
        if ( instance instanceof type )
        {
            return true;
        }
    }
    catch ( e ) {}

    return false;
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
exports.prototype.build = function extend( _, __ )
{
    var build = this;

    // ensure we'll be permitted to instantiate abstract classes for the base
    this._extending = true;

    var a         = arguments,
        an        = a.length,
        props     = ( ( an > 0 ) ? a[ an - 1 ] : 0 ) || {},
        base      = ( ( an > 1 ) ? a[ an - 2 ] : 0 ) || exports.ClassBase,
        prototype = this._getBase( base ),
        cname     = '',
        autoa     = false,

        prop_init      = this._memberBuilder.initMembers(),
        members        = this._memberBuilder.initMembers( prototype ),
        static_members = {
            methods: this._memberBuilder.initMembers(),
            props:   this._memberBuilder.initMembers(),
        },

        meta = exports.getMeta( base ) || {},

        abstract_methods =
            util.clone( meta.abstractMethods )
            || { __length: 0 },

        virtual_members =
            util.clone( meta.virtualMembers )
            || {}
    ;

    // prevent extending final classes
    if ( base.___$$final$$ === true )
    {
        throw Error(
            "Cannot extend final class " +
                ( base[ _priv ].meta.name || '(anonymous)' )
        );
    }

    // grab the name, if one was provided
    if ( cname = props.__name )
    {
        // we no longer need it
        delete props.__name;
    }

    // gobble up auto-abstract flag if present
    if ( ( autoa = props.___$$auto$abstract$$ ) !== undefined )
    {
        delete props.___$$auto$abstract$$;
    }

    // IE has problems with toString()
    if ( enum_bug )
    {
        if ( props.toString !== Object.prototype.toString )
        {
            props.__toString = props.toString;
        }
    }

    // increment class identifier
    this._classId++;

    // if we are inheriting from a prototype, we must make sure that all
    // properties initialized by the ctor are implicitly public; otherwise,
    // proxying will fail to take place
    // TODO: see Class.isA TODO
    if ( ( prototype[ _priv ] || {} ).vis === undefined )
    {
        this._discoverProtoProps( prototype, prop_init );
    }

    // build the various class components (XXX: this is temporary; needs
    // refactoring)
    try
    {
        this.buildMembers( props,
            this._classId,
            base,
            prop_init,
            {
                all:        members,
                'abstract': abstract_methods,
                'static':   static_members,
                'virtual':  virtual_members,
            },
            function( inst )
            {
                return new_class.___$$svis$$;
            }
        );
    }
    catch ( e )
    {
        // intercept warnings /only/
        if ( e instanceof Warning )
        {
            this._warnHandler.handle( e );
        }
        else
        {
            throw e;
        }
    }

    // reference to the parent prototype (for more experienced users)
    prototype.___$$parent$$ = base.prototype;

    // set up the new class
    var new_class = this.createCtor( cname, abstract_methods, members );

    // closure to hold static initialization to be used later by subtypes
    this.initStaticVisibilityObj( new_class );

    var _self = this;
    var staticInit = function( ctor, inheriting )
    {
        _self.attachStatic( ctor, static_members, base, inheriting );
    }
    staticInit( new_class, false );

    this._attachPropInit(
        prototype, prop_init, members, new_class, this._classId
    );

    new_class.prototype             = prototype;
    new_class.prototype.constructor = new_class;
    new_class.___$$props$$          = prop_init;
    new_class.___$$methods$$        = members;
    new_class.___$$sinit$$          = staticInit;

    attachFlags( new_class, props );
    validateAbstract( new_class, cname, abstract_methods, autoa );

    // We reduce the overall cost of this definition by defining it on the
    // prototype rather than during instantiation. While this does increase the
    // amount of time it takes to access the property through the prototype
    // chain, it takes much more time to define the property in this manner.
    // Therefore, we can save a substantial amount of time by defining it on the
    // prototype rather than on each new instance via __initProps().
    util.defineSecureProp( prototype, '__self', new_class.___$$svis$$ );

    // create internal metadata for the new class
    var meta = createMeta( new_class, base );
    meta.abstractMethods = abstract_methods;
    meta.virtualMembers  = virtual_members;
    meta.name            = cname;

    attachAbstract( new_class, abstract_methods );
    attachId( new_class, this._classId );

    // returns a new instance of the class without invoking the constructor
    // (intended for use in prototype chains)
    new_class.asPrototype = function()
    {
        build._extending = true;
        var inst = new_class();
        build._extending = false;
        return inst;
    };

    // we're done with the extension process
    this._extending = false;

    return new_class;
};


exports.prototype._getBase = function( base )
{
    var type = ( typeof base );

    switch ( type )
    {
        // constructor (we could also check to ensure that the return value of
        // the constructor is an object, but that is not our concern)
        case 'function':
            return new base();

        // we can use objects as the prototype directly
        case 'object':
            return base;
    }

    // scalars
    throw TypeError( 'Must extend from Class, constructor or object' );
};


/**
 * Discovers public properties on the given object and create an associated
 * property
 *
 * This allows inheriting from a prototype that uses properties by ensuring
 * that we properly proxy to that property. Otherwise, assigning the value
 * on the private visibilit object would mask the underlying value rather
 * than modifying it, leading to an inconsistent and incorrect state.
 *
 * This assumes that the object has already been initialized with all the
 * properties. This may not be the case if the prototype constructor does
 * not do so, in which case there is nothing we can do.
 *
 * This does not recurse on the prototype chian.
 *
 * For a more detailed description of this issue, see the interoperability
 * test case for classes.
 *
 * @param  {Object}  obj        object from which to gather properties
 * @param  {Object}  prop_init  destination property object
 *
 * @return  {undefined}
 */
exports.prototype._discoverProtoProps = function( obj, prop_init )
{
    var hasOwn = Object.hasOwnProperty,
        pub    = prop_init[ 'public' ];

    for ( var field in obj )
    {
        var value = obj[ field ];

        // we are not interested in the objtype chain, nor are we
        // interested in functions (which are methods and need not be
        // proxied)
        if ( !( hasOwn.call( obj, field ) )
            || typeof value === 'function'
        )
        {
            continue;
        }

        this._memberBuilder.buildProp(
            prop_init, null, field, value, {}
        );
    }
};


exports.prototype.buildMembers = function buildMembers(
    props, class_id, base, prop_init, memberdest, staticInstLookup
)
{
    var context = {
        _cb: this,

        // arguments
        prop_init:        prop_init,
        class_id:         class_id,
        base:             base,
        staticInstLookup: staticInstLookup,

        defs: {},

        // holds member builder state
        state: {},

        // TODO: there does not seem to be tests for these guys; perhaps
        // this can be rectified with the reflection implementation
        members:          memberdest.all,
        abstract_methods: memberdest['abstract'],
        static_members:   memberdest['static'],
        virtual_members:  memberdest['virtual'],
    };

    // default member handlers for parser
    var handlers = {
        each:     _parseEach,
        property: _parseProp,
        getset:   _parseGetSet,
        method:   _parseMethod,
    };

    // a custom parser may be provided to hook the below property parser;
    // this can be done to save time on post-processing, or alter the
    // default behavior of the parser
    if ( props.___$$parser$$ )
    {
        // this isn't something that we actually want to parse
        var parser = props.___$$parser$$;
        delete props.___$$parser$$;

        // TODO: this is recreated every call!
        var hjoin = function( name, orig )
        {
            handlers[ name ] = function()
            {
                var args = [],
                    i    = arguments.length;

                while ( i-- ) args[ i ] = arguments[ i ];

                // invoke the custom handler with the original handler as
                // its last argument (which the custom handler may choose
                // not to invoke at all)
                args.push( orig );
                parser[ name ].apply( context, args );
            };
        };

        // this avoids a performance penalty unless the above property is
        // set
        parser.each     && hjoin( 'each', handlers.each );
        parser.property && hjoin( 'property', handlers.property );
        parser.getset   && hjoin( 'getset', handlers.getset );
        parser.method   && hjoin( 'method', handlers.method );
    }

    // parse members and process accumulated member state
    util.propParse( props, handlers, context );
    this._memberBuilder.end( context.state );
}


function _parseEach( name, value, keywords )
{
    var defs = this.defs;

    // disallow use of our internal __initProps() method
    if ( reserved_members[ name ] === true )
    {
        throw Error( name + " is reserved" );
    }

    // if a member was defined multiple times in the same class
    // declaration, throw an error (unless the `weak' keyword is
    // provided, which exists to accomodate this situation)
    if ( hasOwn.call( defs, name )
        && !( keywords['weak'] || defs[ name ].weak )
    )
    {
        throw Error(
            "Cannot redefine method '" + name + "' in same declaration"
        );
    }

    // keep track of the definitions (only during class declaration)
    // to catch duplicates
    defs[ name ] = keywords;
}


function _parseProp( name, value, keywords )
{
    var dest = ( keywordStatic( keywords ) )
        ? this.static_members.props
        : this.prop_init;

    // build a new property, passing in the other members to compare
    // against for preventing nonsensical overrides
    this._cb._memberBuilder.buildProp(
        dest, null, name, value, keywords, this.base
    );
}


function _parseGetSet( name, get, set, keywords )
{
    var dest = ( keywordStatic( keywords ) )
            ? this.static_members.methods
            : this.members,

        is_static  = keywordStatic( keywords ),
        instLookup = ( ( is_static )
            ? this.staticInstLookup
            : exports.getMethodInstance
        );

    this._cb._memberBuilder.buildGetterSetter(
        dest, null, name, get, set, keywords, instLookup,
        this.class_id, this.base
    );
}


function _parseMethod( name, func, is_abstract, keywords )
{
    var is_static  = keywordStatic( keywords ),
        dest       = ( is_static )
            ? this.static_members.methods
            : this.members,
        instLookup = ( is_static )
            ? this.staticInstLookup
            : exports.getMethodInstance
    ;

    // constructor check
    if ( public_methods[ name ] === true )
    {
        if ( keywords[ 'protected' ] || keywords[ 'private' ] )
        {
            throw TypeError(
                name + " must be public"
            );
        }
    }

    var used = this._cb._memberBuilder.buildMethod(
        dest, null, name, func, keywords, instLookup,
        this.class_id, this.base, this.state
    );

    // do nothing more if we didn't end up using this definition
    // (this may be the case, for example, with weak members)
    if ( !used )
    {
        return;
    }

    // note the concrete method check; this ensures that weak
    // abstract methods will not count if a concrete method of the
    // smae name has already been seen
    if ( is_abstract )
    {
        this.abstract_methods[ name ] = true;
        this.abstract_methods.__length++;
    }
    else if ( ( hasOwn.call( this.abstract_methods, name ) )
        && ( is_abstract === false )
    )
    {
        // if this was a concrete method, then it should no longer
        // be marked as abstract
        delete this.abstract_methods[ name ];
        this.abstract_methods.__length--;
    }

    if ( keywords['virtual'] )
    {
        this.virtual_members[ name ] = true;
    }
}


/**
 * Validates abstract class requirements
 *
 * We permit an `auto' flag for internal use only that will cause the
 * abstract flag to be automatically set if the class should be marked as
 * abstract, instead of throwing an error; this should be used sparingly and
 * never exposed via a public API (for explicit use), as it goes against the
 * self-documentation philosophy.
 *
 * @param  {function()}  ctor              class
 * @param  {string}      cname             class name
 * @param  {{__length}}  abstract_methods  object containing abstract methods
 * @param  {boolean}     auto              automatically flag as abstract
 *
 * @return  {undefined}
 */
function validateAbstract( ctor, cname, abstract_methods, auto )
{
    if ( ctor.___$$abstract$$ )
    {
        if ( !auto && ( abstract_methods.__length === 0 ) )
        {
            throw TypeError(
                "Class " + ( cname || "(anonymous)" ) + " was declared as " +
                "abstract, but contains no abstract members"
            );
        }
    }
    else if ( abstract_methods.__length > 0 )
    {
        if ( auto )
        {
            ctor.___$$abstract$$ = true;
            return;
        }

        throw TypeError(
            "Class " + ( cname || "(anonymous)" ) + " contains abstract " +
            "members and must therefore be declared abstract"
        );
    }
}


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
exports.prototype.createCtor = function( cname, abstract_methods, members )
{
    var new_class;

    if ( abstract_methods.__length === 0 )
    {
        new_class = this.createConcreteCtor( cname, members );
    }
    else
    {
        new_class = this.createAbstractCtor( cname );
    }

    util.defineSecureProp( new_class, _priv, {} );
    return new_class;
}


/**
 * Creates the constructor for a new concrete class
 *
 * This constructor will call the __constructor method of the class, if
 * available.
 *
 * @param  {string}  cname    class name (may be empty)
 * @param  {Object}  members  class members
 *
 * @return  {function()}  constructor
 */
exports.prototype.createConcreteCtor = function( cname, members )
{
    var args  = null,
        _self = this;

    /**
     * Constructor function to be returned
     *
     * The name is set to ClassInstance because some debuggers (e.g. v8) will
     * show the name of this function for constructor instances rather than
     * invoking the toString() method
     *
     * @constructor
     *
     * Suppressing due to complaints for using __initProps
     * @suppress {checkTypes}
     */
    function ClassInstance()
    {
        if ( !( this instanceof ClassInstance ) )
        {
            // store arguments to be passed to constructor and
            // instantiate new object
            args = arguments;
            return new ClassInstance();
        }

        initInstance( this );
        this.__initProps();

        // If we're extending, we don't actually want to invoke any class
        // construction logic. The above is sufficient to use this class in a
        // prototype, so stop here.
        if ( _self._extending )
        {
            return;
        }

        // generate and store unique instance id
        attachInstanceId( this, ++_self._instanceId );

        // FIXME: this is a bit of a kluge for determining whether the ctor
        // should be invoked before a child prector...
        var haspre = ( typeof this.___$$ctor$pre$$ === 'function' );
        if ( haspre
            && ClassInstance.prototype.hasOwnProperty( '___$$ctor$pre$$' )
        )
        {
            // FIXME: we're exposing _priv to something that can be
            // malicously set by the user
            this.___$$ctor$pre$$( _priv );
            haspre = false;
        }

        // call the constructor, if one was provided
        if ( typeof this.__construct === 'function' )
        {
            // note that since 'this' refers to the new class (even
            // subtypes), and since we're using apply with 'this', the
            // constructor will be applied to subtypes without a problem
            this.__construct.apply( this, ( args || arguments ) );
        }

        // FIXME: see above
        if ( haspre )
        {
            this.___$$ctor$pre$$( _priv );
        }

        if ( typeof this.___$$ctor$post$$ === 'function' )
        {
            this.___$$ctor$post$$( _priv );
        }

        args = null;

        // attach any instance properties/methods (done after
        // constructor to ensure they are not overridden)
        attachInstanceOf( this );

        // Provide a more intuitive string representation of the class
        // instance. If a toString() method was already supplied for us,
        // use that one instead.
        if ( !( hasOwn.call( members[ 'public' ], 'toString' ) ) )
        {
            // use __toString if available (see enum_bug), otherwise use
            // our own defaults
            this.toString = members[ 'public' ].__toString
                || ( ( cname )
                    ? function()
                    {
                        return '#<' + cname + '>';
                    }
                    : function()
                    {
                        return '#<anonymous>';
                    }
                )
            ;
        }

    };

    // provide a more intuitive string representation
    ClassInstance.toString = ( cname )
        ? function() { return cname; }
        : function() { return '(Class)'; }
    ;

    return ClassInstance;
}


/**
 * Creates the constructor for a new abstract class
 *
 * Calling this constructor will cause an exception to be thrown, as abstract
 * classes cannot be instantiated.
 *
 * @param  {string}  cname  class name (may be empty)
 *
 * @return  {function()}  constructor
 */
exports.prototype.createAbstractCtor = function( cname )
{
    var _self = this;

    var __abstract_self = function()
    {
        if ( !_self._extending )
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
            return cname;
        }
        : function()
        {
            return '(AbstractClass)';
        }
    ;

    return __abstract_self;
}


/**
 * Attaches __initProps() method to the class prototype
 *
 * The __initProps() method will initialize class properties for that instance,
 * ensuring that their data is not shared with other instances (this is not a
 * problem with primitive data types).
 *
 * The method will also initialize any parent properties (recursive) to ensure
 * that subtypes do not have a referencing issue, and subtype properties take
 * precedence over those of the parent.
 *
 * @param  {Object}  prototype   prototype to attach method to
 * @param  {Object}  properties  properties to initialize
 *
 * @param  {{public: Object, protected: Object, private: Object}}  members
 *
 * @param  {function()}  ctor  class
 * @param  {number}     cid  class id
 *
 * @return  {undefined}
 */
exports.prototype._attachPropInit = function(
    prototype, properties, members, ctor, cid
)
{
    var _self = this;

    util.defineSecureProp( prototype, '__initProps', function( inherit )
    {
        // defaults to false
        inherit = !!inherit;

        var iid    = this.__iid,
            parent = prototype.___$$parent$$,
            vis    = this[ _priv ].vis;

        // first initialize the parent's properties, so that ours will overwrite
        // them
        var parent_init = parent && parent.__initProps;
        if ( typeof parent_init === 'function' )
        {
            // call the parent prop_init, letting it know that it's been
            // inherited so that it does not initialize private members or
            // perform other unnecessary tasks
            parent_init.call( this, true );
        }

        // this will return our property proxy, if supported by our environment,
        // otherwise just a normal object with everything merged in
        var inst_props = _self._visFactory.createPropProxy(
            this, vis, properties[ 'public' ]
        );

        // Copies all public and protected members into inst_props and stores
        // private in a separate object, which adds inst_props to its prototype
        // chain and is returned. This is stored in a property referenced by the
        // class id, so that the private members can be swapped on each method
        // request, depending on calling context.
        var vis = vis[ cid ] = _self._visFactory.setup(
            inst_props, properties, members
        );

        // provide a means to access the actual instance (rather than the
        // property/visibility object) internally (this will translate to
        // this.__inst from within a method), but only if we're on our final
        // object (not a parent)
        if ( !inherit )
        {
            util.defineSecureProp( vis, '__inst', this );
        }
    });
}


/**
 * Determines if the given keywords should result in a static member
 *
 * A member will be considered static if the static or const keywords are given.
 *
 * @param {Object} keywords keywords to scan
 *
 * @return {boolean} true if to be static, otherwise false
 */
function keywordStatic( keywords )
{
    return ( keywords[ 'static' ] || keywords[ 'const' ] )
        ? true
        : false
    ;
}


/**
 * Creates and populates the static visibility object
 *
 * @param  {Function}  ctor  class
 *
 * @return  {undefined}
 */
exports.prototype.initStaticVisibilityObj = function( ctor )
{
    var _self = this;

    /**
     * the object will simply be another layer in the prototype chain to
     * prevent protected/private members from being mixed in with the public
     *
     * @constructor
     */
    var sobj = function() {};
    sobj.prototype = ctor;

    var sobji = new sobj();

    // override __self on the instance's visibility object, giving internal
    // methods access to the restricted static methods
    ctor.___$$svis$$ = sobji;

    // Override the class-level accessor method to allow the system to know we
    // are within a method. An internal flag is necessary, rather than using an
    // argument or binding, because those two options are exploitable. An
    // internal flag cannot be modified by conventional means.
    sobji.$ = function()
    {
        _self._spropInternal = true;
        var val = ctor.$.apply( ctor, arguments );
        _self._spropInternal = false;

        return val;
    };
}


/**
 * Attaches static members to a constructor (class)
 *
 * Static methods will be assigned to the constructor itself. Properties, on the
 * other hand, will be assigned to ctor.$. The reason for this is because JS
 * engines pre-ES5 support no means of sharing references to primitives. Static
 * properties of subtypes should share references to the static properties of
 * their parents.
 *
 * @param  {function()}  ctor        class
 * @param  {Object}      members     static members
 * @param  {function()}  base        base class inheriting from
 * @param  {boolean}     inheriting  true if inheriting static members,
 *                                   otherwise false (setting own static
 *                                   members)
 *
 * @return  {undefined}
 */
exports.prototype.attachStatic = function( ctor, members, base, inheriting )
{
    var methods = members.methods,
        props   = members.props,
        _self   = this
    ;

    // "Inherit" the parent's static methods by running the parent's static
    // initialization method. It is important that we do this before anything,
    // because this will recursively inherit all members in order, permitting
    // overrides.
    var baseinit = base.___$$sinit$$;
    if ( baseinit )
    {
        baseinit( ctor, true );
    }

    // initialize static property if not yet defined
    if ( !inheriting )
    {
        ctor.___$$sprops$$ = props;

        // provide a method to access static properties
        util.defineSecureProp( ctor, '$', function( prop, val )
        {
            // we use hasOwnProperty to ensure that undefined values will not
            // cause us to continue checking the parent, thereby potentially
            // failing to set perfectly legal values
            var found = false,

                // Determine if we were invoked in the context of a class. If
                // so, use that.  Otherwise, use ourself.
                context = ( this.___$$sprops$$ ) ? this : ctor,

                // We are in a subtype if the context does not match the
                // constructor. This works because, when invoked for the first
                // time, this method is not bound to the constructor. In such a
                // case, we default the context to the constructor and pass that
                // down the line to each recursive call. Therefore, recursive
                // calls to subtypes will have a context mismatch.
                in_subtype = ( context !== ctor )
            ;

            // Attempt to locate the property. First, we check public. If not
            // available and we are internal (within a method), we can move on
            // to check other levels of visibility. `found` will contain the
            // visibility level the property was found in, or false.
            found = hasOwn.call( props[ 'public' ], prop ) && 'public';
            if ( !found && _self._spropInternal )
            {
                // Check for protected/private. We only check for private
                // properties if we are not currently checking the properties of
                // a subtype. This works because the context is passed to each
                // recursive call.
                found = hasOwn.call( props[ 'protected' ], prop ) && 'protected'
                    || !in_subtype
                        && hasOwn.call( props[ 'private' ], prop ) && 'private'
                ;
            }

            // if we don't own the property, let the parent(s) handle it
            if ( found === false )
            {
                // TODO: This check is simple, but quick. It may be worth
                // setting a flag on the class during definition to specify if
                // it's extending from a non-class base.
                return ( base.__cid && base.$ || exports.ClassBase.$ ).apply(
                    context, arguments
                );
            }

            var prop_item = props[ found ][ prop ];

            // if a value was provided, this method should be treated as a
            // setter rather than a getter (we *must* test using
            // arguments.length to ensure that setting to undefined works)
            if ( arguments.length > 1 )
            {
                // if const, disallow modification
                if ( prop_item[ 1 ][ 'const' ] )
                {
                    throw TypeError(
                        "Cannot modify constant property '" + prop + "'"
                    );
                }

                prop_item[ 0 ] = val;
                return context;
            }
            else
            {
                // return the value
                return prop_item[ 0 ];
            }
        } );
    }

    // copy over public static methods
    util.copyTo( ctor, methods[ 'public' ], true );
    util.copyTo( ctor.___$$svis$$, methods[ 'protected' ], true );

    // private methods should not be inherited by subtypes
    if ( !inheriting )
    {
        util.copyTo( ctor.___$$svis$$, methods[ 'private' ], true );
    }
}


/**
 * Initializes class metadata for the given class
 *
 * @param  {Function}  func     class to initialize metadata for
 * @param  {Function}  cparent  class parent
 *
 * @return  {undefined}
 *
 * Suppressed due to warnings for use of __cid
 * @suppress {checkTypes}
 */
function createMeta( func, cparent )
{
    var id          = func.__cid,
        parent_meta = ( ( cparent.__cid )
            ? exports.getMeta( cparent )
            : undefined
        );

    // copy the parent prototype's metadata if it exists (inherit metadata)
    if ( parent_meta )
    {
        return func[ _priv ].meta = util.clone( parent_meta, true );
    }

    // create empty
    return func[ _priv ].meta = {
        implemented: [],
    };
}


/**
 * Attaches an instance identifier to a class instance
 *
 * @param  {Object}  instance  class instance
 * @param  {number}  iid       instance id
 *
 * @return  {undefined}
 */
function attachInstanceId( instance, iid )
{
    util.defineSecureProp( instance, '__iid', iid );
}


/**
 * Initializes class instance
 *
 * This process will create the instance visibility object that will contain
 * private and protected members. The class instance is part of the prototype
 * chain.  This will be passed to all methods when invoked, permitting them to
 * access the private and protected members while keeping them encapsulated.
 *
 * For each instance, there is always a base. The base will contain a proxy to
 * the public members on the instance itself. The base will also contain all
 * protected members.
 *
 * Atop the base object is a private member object, with the base as its
 * prototype. There exists a private member object for the instance itself and
 * one for each supertype. This is stored by the class id (cid) as the key. This
 * permits the private member object associated with the class of the method
 * call to be bound to that method. For example, if a parent method is called,
 * that call must be invoked in the context of the parent, so the private
 * members of the parent must be made available.
 *
 * The resulting structure looks something like this:
 *   class_instance = { iid: { cid: {} } }
 *
 * @param  {Object}  instance  instance to initialize
 *
 * @return  {undefined}
 */
function initInstance( instance )
{
    /** @constructor */
    var prot = function() {};
    prot.prototype = instance;

    // initialize our *own* private metadata store; do not use the
    // prototype's
    util.defineSecureProp( instance, _priv, {} );

    // add the visibility objects to the data object for this class instance
    instance[ _priv ].vis = new prot();
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

    // TODO: To improve performance (defineSecureProp can be costly), simply
    // define a normal prop and freeze the class afterward. The class shouldn't
    // have any mutable methods.
    util.defineSecureProp( instance, 'isInstanceOf', method );
    util.defineSecureProp( instance, 'isA', method );
}


/**
 * Returns the instance object associated with the given method
 *
 * The instance object contains the protected members. This object can be passed
 * as the context when calling a method in order to give that method access to
 * those members.
 *
 * One level above the instance object on the prototype chain is the object
 * containing the private members. This is swappable, depending on the class id
 * associated with the provided method call. This allows methods that were not
 * overridden by the subtype to continue to use the private members of the
 * supertype.
 *
 * @param  {function()}  inst  instance that the method is being called from
 * @param  {number}      cid   class id
 *
 * @return  {Object|null}  instance object if found, otherwise null
 *
 * @suppress {checkTypes}
 */
exports.getMethodInstance = function( inst, cid )
{
    if ( inst === undefined )
    {
        return null;
    }

    var iid  = inst.__iid,
        priv = inst[ _priv ],
        data;

    return ( iid && priv && ( data = priv.vis ) )
        ? data[ cid ]
        : null
    ;
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
     * @return  {boolean}  true if class is abstract, otherwise false
     */
    util.defineSecureProp( func, 'isAbstract', function()
    {
        return is_abstract;
    });
}


/**
 * Attaches the unique id to the class and its prototype
 *
 * The unique identifier is used internally to match a class and its instances
 * with the class metadata. Exposing the id breaks encapsulation to a degree,
 * but is a lesser evil when compared to exposing all metadata.
 *
 * @param  {function()}  ctor  constructor (class) to attach method to
 * @param  {number}      id    id to assign
 *
 * @return  {undefined}
 */
function attachId( ctor, id )
{
    util.defineSecureProp( ctor, '__cid', id );
    util.defineSecureProp( ctor.prototype, '__cid', id );
}


/**
 * Sets class flags
 *
 * @param  {Function}  ctor   class to flag
 * @param  {Object}   props  class properties
 *
 * @return  {undefined}
 */
function attachFlags( ctor, props )
{
    ctor.___$$final$$    = !!( props.___$$final$$ );
    ctor.___$$abstract$$ = !!( props.___$$abstract$$ );

    // The properties are no longer needed. Set to undefined rather than delete
    // (v8 performance)
    props.___$$final$$ = props.___$$abstract$$ = undefined;
}


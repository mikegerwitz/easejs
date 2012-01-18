/**
 * Handles building of classes
 *
 *  Copyright (C) 2010,2011 Mike Gerwitz
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
 *
 * TODO: This module is currently being tested /indirectly/ by the class tests.
 *       This is because of a refactoring. All of this logic used to be part of
 *       the class module. Test this module directly, but keep the existing
 *       class tests in tact for a higher-level test.
 */

var util    = require( __dirname + '/util' ),
    warn    = require( __dirname + '/warn' ),
    Warning = warn.Warning,

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
        'toString':    true,
        '__toString':  true,
    };


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
function ClassBuilder( member_builder, visibility_factory )
{
    // allow ommitting the 'new' keyword
    if ( !( this instanceof exports ) )
    {
        // module.exports for Closure Compiler
        return new module.exports( member_builder, visibility_factory );
    }

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
 * @return  {__class_meta}
 */
exports.getMeta = function( cls )
{
    return cls.___$$meta$$ || {};
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

    try
    {
        // check prototype chain (will throw an error if type is not a
        // constructor (function)
        if ( instance instanceof type )
        {
            return true;
        }
    }
    catch ( e ) {}

    // if no metadata is available, then our remaining checks cannot be
    // performed
    if ( !instance.__cid || !( meta = exports.getMeta( instance ) ) )
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
    // ensure we'll be permitted to instantiate abstract classes for the base
    this._extending = true;

    var args      = Array.prototype.slice.call( arguments ),
        props     = args.pop() || {},
        base      = args.pop() || exports.ClassBase,
        prototype = this._getBase( base ),
        cname     = '',

        prop_init      = this._memberBuilder.initMembers(),
        members        = this._memberBuilder.initMembers( prototype ),
        static_members = {
            methods: this._memberBuilder.initMembers(),
            props:   this._memberBuilder.initMembers(),
        },

        abstract_methods =
            util.clone( exports.getMeta( base ).abstractMethods )
            || { __length: 0 }
    ;

    // prevent extending final classes
    if ( base.___$$final$$ === true )
    {
        throw Error(
            "Cannot extend final class " +
                ( base.___$$meta$$.name || '(anonymous)' )
        );
    }

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

    // increment class identifier
    this._classId++;

    // build the various class components (xxx: this is temporary; needs
    // refactoring)
    try
    {
        this.buildMembers( props,
            this._classId,
            base,
            prop_init,
            abstract_methods,
            members,
            static_members,
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
            warn.handle( e );
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
    initStaticVisibilityObj( new_class );
    var staticInit = function( ctor, inheriting )
    {
        attachStatic( ctor, static_members, base, inheriting );
    }
    staticInit( new_class, false );

    this._attachPropInit(
        prototype, prop_init, members, new_class, this._classId
    );

    new_class.prototype      = prototype;
    new_class.constructor    = new_class;
    new_class.___$$props$$   = prop_init;
    new_class.___$$methods$$ = members;
    new_class.___$$sinit$$   = staticInit;

    attachFlags( new_class, props );

    validateAbstract( new_class, cname, abstract_methods );

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
    meta.name            = cname;

    attachAbstract( new_class, abstract_methods );
    attachId( new_class, this._classId );

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


exports.prototype.buildMembers = function buildMembers(
    props, class_id, base, prop_init, abstract_methods, members,
    static_members, staticInstLookup
)
{
    var hasOwn = Array.prototype.hasOwnProperty,
        defs   = {},

        smethods = static_members.methods,
        sprops   = static_members.props,

        _self = this
    ;

    util.propParse( props, {
        each: function( name, value, keywords )
        {
            // disallow use of our internal __initProps() method
            if ( reserved_members[ name ] === true )
            {
                throw Error( name + " is reserved" );
            }

            // if a member was defined multiple times in the same class
            // declaration, throw an error
            if ( hasOwn.call( defs, name ) )
            {
                throw Error(
                    "Cannot redefine method '" + name + "' in same declaration"
                );
            }

            // keep track of the definitions (only during class declaration)
            // to catch duplicates
            defs[ name ] = 1;
        },

        property: function( name, value, keywords )
        {
            var dest = ( keywordStatic( keywords ) ) ? sprops : prop_init;

            // build a new property, passing in the other members to compare
            // against for preventing nonsensical overrides
            _self._memberBuilder.buildProp(
                dest, null, name, value, keywords, base
            );
        },

        getset: function( name, get, set, keywords )
        {
            var dest = ( keywordStatic( keywords ) ) ? smethods : members;

            _self._memberBuilder.buildGetterSetter(
                dest, null, name, get, set, keywords, base
            );
        },

        method: function( name, func, is_abstract, keywords )
        {
            var is_static  = keywordStatic( keywords ),
                dest       = ( is_static ) ? smethods : members,
                instLookup = ( is_static )
                    ? staticInstLookup
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

            _self._memberBuilder.buildMethod(
                dest, null, name, func, keywords, instLookup,
                class_id, base
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
    } );
}


/**
 * Validates abstract class requirements
 *
 * @param  {function()}  ctor              class
 * @param  {string}      cname             class name
 * @param  {{__length}}  abstract_methods  object containing abstract methods
 *
 * @return  {undefined}
 */
function validateAbstract( ctor, cname, abstract_methods )
{
    if ( ctor.___$$abstract$$ )
    {
        if ( abstract_methods.__length === 0 )
        {
            throw TypeError(
                "Class " + ( cname || "(anonymous)" ) + " was declared as " +
                "abstract, but contains no abstract members"
            );
        }
    }
    else
    {
        if ( abstract_methods.__length > 0 )
        {
            throw TypeError(
                "Class " + ( cname || "(anonymous)" ) + " contains abstract " +
                "members and must therefore be declared abstract"
            );
        }
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
    // concrete class
    if ( abstract_methods.__length === 0 )
    {
        return this.createConcreteCtor( cname, members );
    }
    // abstract class
    else
    {
        return this.createAbstractCtor( cname );
    }
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

        // call the constructor, if one was provided
        if ( typeof this.__construct === 'function' )
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
            parent = prototype.___$$parent$$;

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
            this, this.___$$vis$$, properties[ 'public' ]
        );

        // Copies all public and protected members into inst_props and stores
        // private in a separate object, which adds inst_props to its prototype
        // chain and is returned. This is stored in a property referenced by the
        // class id, so that the private members can be swapped on each method
        // request, depending on calling context.
        var vis = this.___$$vis$$[ cid ] = _self._visFactory.setup(
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
function initStaticVisibilityObj( ctor )
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
function attachStatic( ctor, members, base, inheriting )
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
            var has   = Object.prototype.hasOwnProperty,
                found = false,

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
            found = has.call( props[ 'public' ], prop ) && 'public';
            if ( !found && _self._spropInternal )
            {
                // Check for protected/private. We only check for private
                // properties if we are not currently checking the properties of
                // a subtype. This works because the context is passed to each
                // recursive call.
                found = has.call( props[ 'protected' ], prop ) && 'protected'
                    || !in_subtype
                        && has.call( props[ 'private' ], prop ) && 'private'
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
        func.___$$meta$$ = util.clone( parent_meta, true );
    }
    else
    {
        // create empty
        func.___$$meta$$ = {
            implemented: [],
        };
    }

    // store the metadata in the prototype as well (inconsiderable overhead;
    // it's just a reference)
    func.prototype.___$$meta$$ = func.___$$meta$$;

    return func.___$$meta$$;
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

    // add the visibility objects to the data object for this class instance
    instance.___$$vis$$ = new prot();
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
    var iid  = inst.__iid,
        data = inst.___$$vis$$;

    return ( iid && data )
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


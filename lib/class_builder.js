/**
 * Handles building of classes
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
 *
 * TODO: This module is currently being tested /indirectly/ by the class tests.
 *       This is because of a refactoring. All of this logic used to be part of
 *       the class module. Test this module directly, but keep the existing
 *       class tests in tact for a higher-level test.
 */

var util           = require( __dirname + '/util' ),
    member_builder = require( __dirname + '/member_builder' ),
    propobj        = require( __dirname + '/propobj' ),

    /**
     * Class id counter, to be increment on each new definition
     * @type {number}
     */
    class_id = 0,

    /**
     * Instance id counter, to be incremented on each new instance
     * @type {number}
     */
    instance_id = 0,

    /**
     * Set to TRUE when class is in the process of being extended to ensure that
     * a constructor can be instantiated (to use as the prototype) without
     * invoking the class construction logic
     *
     * @type {boolean}
     */
    extending = false,

    /**
     * Hash of reserved members
     *
     * These methods cannot be defined in the class. They are for internal use
     * only. We must check both properties and methods to ensure that neither is
     * defined.
     *
     * @type {Object.<string,boolean>}
     */
    reserved_members = { '__initProps': true },

    /**
     * Hash of methods that must be public
     *
     * Notice that this is a list of /methods/, not members, because this check
     * is performed only for methods. This is for performance reasons. We do not
     * have a situation where we will want to check for properties as well.
     *
     * @type {Object.<string,boolean}
     */
    public_methods = {
        '__construct': true,
        'toString':    true,
        '__toString':  true,
    }
;


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
 * Default class implementation
 *
 * @return undefined
 */
exports.ClassBase = function Class() {};


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
exports.build = function extend()
{
    // ensure we'll be permitted to instantiate abstract classes for the base
    extending = true;

    var args      = Array.prototype.slice.call( arguments ),
        props     = args.pop() || {},
        base      = args.pop() || exports.ClassBase,
        prototype = new base(),
        cname     = '',

        prop_init      = member_builder.initMembers(),
        members        = member_builder.initMembers( prototype ),
        static_members = {
            methods: member_builder.initMembers(),
            props:   member_builder.initMembers(),
        }

        abstract_methods =
            util.clone( exports.getMeta( base ).abstractMethods )
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

    // increment class identifier
    class_id++;

    // build the various class components (xxx: this is temporary; needs
    // refactoring)
    buildMembers( props,
        class_id,
        base,
        prop_init,
        abstract_methods,
        members,
        static_members
    );

    // reference to the parent prototype (for more experienced users)
    prototype.___$$parent$$ = base.prototype;

    // set up the new class
    var new_class = createCtor( cname, abstract_methods, members );

    // closure to hold static initialization to be used later by subtypes
    var staticInit = function( ctor, inheriting )
    {
        attachStatic( ctor, static_members, base, inheriting );
    }
    staticInit( new_class, false );

    attachPropInit( prototype, prop_init, members, class_id );

    new_class.prototype      = prototype;
    new_class.constructor    = new_class;
    new_class.___$$props$$   = prop_init;
    new_class.___$$methods$$ = members;
    new_class.___$$sinit$$   = staticInit;

    // We reduce the overall cost of this definition by defining it on the
    // prototype rather than during instantiation. While this does increase the
    // amount of time it takes to access the property through the prototype
    // chain, it takes much more time to define the property in this manner.
    // Therefore, we can save a substantial amount of time by defining it on the
    // prototype rather than on each new instance via __initProps().
    util.defineSecureProp( prototype, '__self', new_class );

    // create internal metadata for the new class
    var meta = createMeta( new_class, base );
    meta.abstractMethods = abstract_methods;
    meta.name            = cname;

    attachAbstract( new_class, abstract_methods );
    attachId( new_class, class_id );

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
        return createConcreteCtor( cname, members );
    }
    // abstract class
    else
    {
        return createAbstractCtor( cname );
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
function createConcreteCtor( cname, members )
{
    var args = null;

    // constructor function to be returned (the name is set to ClassInstance
    // because some debuggers (e.g. v8) will show the name of this function for
    // constructor instances rather than invoking the toString() method)
    var ClassInstance = function ClassInstance()
    {
        if ( !( this instanceof ClassInstance ) )
        {
            // store arguments to be passed to constructor and
            // instantiate new object
            args = arguments;
            return new ClassInstance();
        }

        // generate and store unique instance id
        attachInstanceId( this, ++instance_id, ClassInstance );

        initInstance( instance_id, this );
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
function createAbstractCtor( cname )
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
            return cname;
        }
        : function()
        {
            return '(AbstractClass)';
        }
    ;

    return __abstract_self;
}


function buildMembers(
    props, class_id, base, prop_init, abstract_methods, members,
    static_members
)
{
    var hasOwn = Array.prototype.hasOwnProperty,
        defs   = {},

        smethods = static_members.methods,
        sprops   = static_members.props
    ;

    util.propParse( props, {
        each: function( name, value, keywords )
        {
            // disallow use of our internal __initProps() method
            if ( reserved_members[ name ] === true )
            {
                throw Error(
                    ( ( cname ) ? cname + '::' : '' ) +
                    ( name + " is reserved" )
                );
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
            var dest = ( keywords[ 'static' ] ) ? sprops : prop_init;

            // build a new property, passing in the other members to compare
            // against for preventing nonsensical overrides
            member_builder.buildProp(
                dest, null, name, value, keywords, base
            );
        },

        getter: function( name, value, keywords )
        {
            var dest = ( keywords[ 'static' ] ) ? smethods : members;

            member_builder.buildGetter(
                dest, null, name, value, keywords
            );
        },

        setter: function( name, value, keywords )
        {
            var dest = ( keywords[ 'static' ] ) ? smethods : members;

            member_builder.buildSetter(
                dest, null, name, value, keywords
            );
        },

        method: function( name, func, is_abstract, keywords )
        {
            var dest = ( keywords[ 'static' ] ) ? smethods : members;

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

            member_builder.buildMethod(
                dest, null, name, func, keywords, getMethodInstance,
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
 * @param  {number}  cid         class id
 *
 * @return  {undefined}
 */
function attachPropInit( prototype, properties, members, cid )
{
    util.defineSecureProp( prototype, '__initProps', function( inherit )
    {
        // defaults to false
        inherit = !!inherit;

        var iid = this.__iid;

        // first initialize the parent's properties, so that ours will overwrite
        // them
        var parent_init = prototype.___$$parent$$.__initProps;
        if ( parent_init instanceof Function )
        {
            // call the parent prop_init, letting it know that it's been
            // inherited so that it does not initialize private members or
            // perform other unnecessary tasks
            parent_init.call( this, true );
        }

        // this will return our property proxy, if supported by our environment,
        // otherwise just a normal object with everything merged in
        var inst_props = propobj.createPropProxy(
            this, this.___$$vis$$, properties[ 'public' ]
        );

        // Copies all public and protected members into inst_props and stores
        // private in a separate object, which adds inst_props to its prototype
        // chain and is returned. This is stored in a property referenced by the
        // class id, so that the private members can be swapped on each method
        // request, depending on calling context.
        var vis = this.___$$vis$$[ cid ] = propobj.setup(
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
        props   = members.props;

    // "inherit" the parent's static methods by running the parent's static
    // initialization method
    var baseinit = base.___$$sinit$$;
    if ( baseinit )
    {
        baseinit( ctor, true );
    }

    // initialize static property if not yet defined
    if ( !inheriting )
    {
        // "inherit" properties from the supertype, if available
        ctor.$ = base.$ || {};

        // add our own properties
        util.copyTo( ctor.$, props[ 'public' ], true );
    }

    // copy over public static members (deep copy; we don't want subtypes to
    // share references with their parents)
    util.copyTo( ctor, methods[ 'public' ], true );
}


/**
 * Initializes class metadata for the given class
 *
 * @param  {Class}  func     class to initialize metadata for
 * @param  {Class}  cparent  class parent
 *
 * @return  {undefined}
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
 * Returns reference to metadata for the requested class
 *
 * Since a reference is returned (rather than a copy), the returned object can
 * be modified to alter the metadata.
 *
 * @param  {Class}  cls  class from which to retrieve metadata
 *
 * @return  {Object}
 */
exports.getMeta = function( cls )
{
    return cls.___$$meta$$ || {};
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
 * This process will create the instance visibility object containing private
 * and protected members. The class instance is part of the prototype chain.
 * This will be passed to all methods when invoked, permitting them to access
 * the private and protected members while keeping them encapsulated.
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
 * @param  {number}  iid       instance id
 * @param  {Object}  instance  instance to initialize
 *
 * @return  {undefined}
 */
function initInstance( iid, instance )
{
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
 * @return  {Object,null}  instance object if found, otherwise null
 */
function getMethodInstance( inst, cid )
{
    var iid  = inst.__iid,
        data = inst.___$$vis$$;

    return ( iid && data )
        ? data[ cid ]
        : null
    ;
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

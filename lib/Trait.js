/**
 * Provides system for code reuse via traits
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
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

var AbstractClass = require( './class_abstract' ),
    ClassBuilder  = require( './ClassBuilder' ),
    Interface     = require( './interface' );


function _fvoid() {};


/**
 * Trait constructor / base object
 *
 * The interpretation of the argument list varies by number. Further,
 * various trait methods may be used as an alternative to invoking this
 * constructor.
 *
 * @return  {Function}  trait
 */
function Trait()
{
    switch ( arguments.length )
    {
        case 0:
            throw Error( "Missing trait name or definition" );

        case 1:
            return ( typeof arguments[ 0 ] === 'string' )
                ? _createStaging.apply( this, arguments )
                : Trait.extend.apply( this, arguments );

        case 2:
            return createNamedTrait.apply( this, arguments );
    }

    throw Error(
        "Expecting at most two arguments for definition of named " +
            "Trait " + name + "'; " + arguments.length + " given"
    );
};


/**
 * Create a named trait
 *
 * @param  {string}  name  trait name
 * @param  {Object}  def   trait definition
 *
 * @return  {Function}  named trait
 */
function createNamedTrait( name, dfn )
{
    if ( typeof name !== 'string' )
    {
        throw Error(
            "First argument of named class definition must be a string"
        );
    }

    dfn.__name = name;
    return Trait.extend( dfn );
}


function _createStaging( name )
{
    return {
        extend: function( dfn )
        {
            return createNamedTrait( name, dfn );
        },

        implement: function()
        {
            return createImplement( arguments, name );
        },
    };
}


Trait.extend = function( dfn )
{
    // we may have been passed some additional metadata
    var meta = ( this || {} ).__$$meta || {};

    // store any provided name, since we'll be clobbering it (the definition
    // object will be used to define the hidden abstract class)
    var name    = dfn.__name || '(Trait)',
        type    = _getTraitType( dfn ),
        isparam = ( type === 'param' );

    // augment the parser to handle our own oddities
    dfn.___$$parser$$ = {
        each:     _parseMember,
        property: _parseProps,
        getset:   _parseGetSet,
    };

    // automatically mark ourselves as abstract if an abstract method is
    // provided
    dfn.___$$auto$abstract$$ = true;

    // give the abstract trait class a distinctive name for debugging
    dfn.__name = '#AbstractTrait#';

    // if __mixin was provided,in the definition, then we should crate a
    // paramaterized trait
    var Trait = ( isparam )
        ? function ParameterTraitType()
        {
            // duplicate ars in a way that v8 can optimize
            var args = [], i = arguments.length;
            while ( i-- ) args[ i ] = arguments[ i ];

            var AT = function ArgumentTrait()
            {
                throw Error( "Cannot re-configure argument trait" );
            };

            // TODO: mess!
            AT.___$$mixinargs = args;
            AT.__trait        = 'arg';
            AT.__acls         = Trait.__acls;
            AT.__ccls         = Trait.__ccls;
            AT.toString       = Trait.toString;
            AT.__mixinImpl    = Trait.__mixinImpl;
            AT.__isInstanceOf = Trait.__isInstanceOf;

            // mix in the argument trait instead of the original
            AT.__mixin = function( dfn, tc, base )
            {
                mixin( AT, dfn, tc, base );
            };

            return AT;
        }
        : function TraitType()
        {
            throw Error( "Cannot instantiate non-parameterized trait" );
        };

    // implement interfaces if indicated
    var base = AbstractClass;
    if ( meta.ifaces )
    {
        base = base.implement.apply( null, meta.ifaces );
    }

    // and here we can see that traits are quite literally abstract classes
    var tclass = base.extend( dfn );

    Trait.__trait  = type;
    Trait.__acls   = tclass;
    Trait.__ccls   = null;
    Trait.toString = function()
    {
        return ''+name;
    };

    // we're not a param trait, but we want consistent data
    Trait.___$$mixinargs = [];

    // invoked to trigger mixin
    Trait.__mixin = function( dfn, tc, base )
    {
        mixin( Trait, dfn, tc, base );
    };

    // mixes in implemented types
    Trait.__mixinImpl = function( dest_meta )
    {
        mixinImpl( tclass, dest_meta );
    };

    // TODO: this and the above should use util.defineSecureProp
    Trait.__isInstanceOf = Interface.isInstanceOf;

    return Trait;
};


/**
 * Retrieve a string representation of the trait type
 *
 * A trait is parameterized if it has a __mixin method; otherwise, it is
 * standard.
 *
 * @param   {Object}  dfn  trait definition object
 * @return  {string}  trait type
 */
function _getTraitType( dfn )
{
    return ( typeof dfn.__mixin === 'function' )
        ? 'param'
        : 'std';
}


/**
 * Verifies trait member restrictions
 *
 * @param  {string}   name      property name
 * @param  {*}        value     property value
 * @param  {Object}   keywords  property keywords
 * @param  {Function} h         original handler that we replaced
 *
 * @return  {undefined}
 */
function _parseMember( name, value, keywords, h )
{
    // traits are not permitted to define constructors
    if ( name === '__construct' )
    {
        throw Error( "Traits may not define __construct" );
    }

    // will be supported in future versions
    if ( keywords['static'] )
    {
        throw Error(
            "Cannot define member `" + name + "'; static trait " +
            "members are currently unsupported"
        );
    }

    // apply original handler
    h.apply( this, arguments );
}


/**
 * Throws error if non-internal property is found within PROPS
 *
 * For details and rationale, see the Trait/PropertyTest case.
 *
 * @param  {string}   name      property name
 * @param  {*}        value     property value
 * @param  {Object}   keywords  property keywords
 * @param  {Function} h         original handler that we replaced
 *
 * @return  {undefined}
 */
function _parseProps( name, value, keywords, h )
{
    // ignore internal properties
    if ( name.substr( 0, 3 ) === '___' )
    {
        return;
    }

    if ( !( keywords['private'] ) )
    {
        throw Error(
            "Cannot define property `" + name + "'; only private " +
            "properties are permitted within Trait definitions"
        );
    }

    // apply original handler
    h.apply( this, arguments );
}


/**
 * Immediately throws an exception, as getters/setters are unsupported
 *
 * This is a temporary restriction; they will be supported in future
 * releases.
 *
 * @param  {string}   name      property name
 * @param  {*}        value     property value
 * @param  {Object}   keywords  property keywords
 * @param  {Function} h         original handler that we replaced
 *
 * @return  {undefined}
 */
function _parseGetSet( name, value, keywords, h )
{
    throw Error(
        "Cannot define property `" + name + "'; getters/setters are " +
        "currently unsupported"
    );
}


/**
 * Implement one or more interfaces
 *
 * Implementing an interface into a trait has the same effect as it does
 * within classes in that it will automatically define abstract methods
 * unless a concrete method is provided. Further, the class that the trait
 * is mixed into will act as though it implemented the interfaces.
 *
 * @param  {...Function}  interfaces  interfaces to implement
 *
 * @return  {Object}  staged trait object
 */
Trait.implement = function()
{
    return createImplement( arguments );
};


/**
 * Create a staging object from which a trait implementing a set of
 * interfaces may be defined
 *
 * @param  {...Function}  interfaces  interfaces to implement
 * @param  {string=}      name        optional trait name
 *
 * @return  {Object}  staged trait object
 */
function createImplement( ifaces, name )
{
    return {
        extend: function( dfn )
        {
            if ( name )
            {
                dfn.__name = name;
            }

            // pass our interface metadata as the invocation context
            return Trait.extend.call(
                { __$$meta: { ifaces: ifaces } },
                dfn
            );
        },
    };
}


/**
 * Determines if the provided value references a trait
 *
 * @param   {*}        trait  value to check
 * @return  {boolean}  whether the provided value references a trait
 */
Trait.isTrait = function( trait )
{
    return !!( trait || {} ).__trait;
};


/**
 * Determines if the provided value references a parameterized trait
 *
 * @param   {*}        trait  value to check
 * @return  {boolean}  whether the provided value references a param trait
 */
Trait.isParameterTrait = function( trait )
{
    return !!( ( trait || {} ).__trait === 'param' );
};


/**
 * Determines if the provided value references an argument trait
 *
 * An argument trait is a configured parameter trait.
 *
 * @param   {*}        trait  value to check
 * @return  {boolean}  whether the provided value references an arg trait
 */
Trait.isArgumentTrait = function( trait )
{
    return !!( ( trait || {} ).__trait === 'arg' );
};


/**
 * Create a concrete class from the abstract trait class
 *
 * This class is the one that will be instantiated by classes that mix in
 * the trait.
 *
 * @param  {AbstractClass}  acls  abstract trait class
 *
 * @return  {Class}  concrete trait class for instantiation
 */
function createConcrete( acls )
{
    // start by providing a concrete implementation for our dummy method and
    // a constructor that accepts the protected member object of the
    // containing class
    var dfn = {
        // protected member object (we define this as protected so that the
        // parent ACLS has access to it (!), which is not prohibited since
        // JS does not provide a strict typing mechanism...this is a kluge)
        // and target supertype---that is, what __super calls should
        // referene
        'protected ___$$pmo$$': null,
        'protected ___$$super$$': null,
        __construct: function( base, pmo )
        {
            this.___$$super$$ = base;
            this.___$$pmo$$   = pmo;
        },

        // mainly for debugging; should really never see this.
        __name: '#ConcreteTrait#',
    };

    // every abstract method should be overridden with a proxy to the
    // protected member object that will be passed in via the ctor
    var amethods = ClassBuilder.getMeta( acls ).abstractMethods;
    for ( var f in amethods )
    {
        // TODO: would be nice if this check could be for '___'; need to
        // replace amethods.__length with something else, then
        if ( !( Object.hasOwnProperty.call( amethods, f ) )
            || ( f.substr( 0, 2 ) === '__' )
        )
        {
            continue;
        }

        // we know that if it's not public, then it must be protected
        var vis = ( acls.___$$methods$$['public'][ f ] !== undefined )
            ? 'public'
            : 'protected';

        // setting the correct visibility modified is important to prevent
        // visibility de-escalation errors if a protected concrete method is
        // provided
        dfn[ vis + ' proxy ' + f ] = '___$$pmo$$';
    }

    // virtual methods need to be handled with care to ensure that we invoke
    // any overrides
    createVirtProxy( acls, dfn );

    return acls.extend( dfn );
}


/**
 * Create virtual method proxies for all virtual members
 *
 * Virtual methods are a bit of hassle with traits: we are in a situation
 * where we do not know at the time that the trait is created whether or not
 * the virtual method has been overridden, since the class that the trait is
 * mixed into may do the overriding. Therefore, we must check if an override
 * has occured *when the method is invoked*; there is room for optimization
 * there (by making such a determination at the time of mixin), but we'll
 * leave that for later.
 *
 * @param  {AbstractClass}  acls  abstract trait class
 * @param  {Object}         dfn   destination definition object
 *
 * @return  {undefined}
 */
function createVirtProxy( acls, dfn )
{
    var vmembers = ClassBuilder.getMeta( acls ).virtualMembers;

    // f = `field'
    for ( var f in vmembers )
    {
        var vis = ( acls.___$$methods$$['public'][ f ] !== undefined )
            ? 'public'
            : 'protected';

        var srcmethod = acls.___$$methods$$[ vis ][ f ],
            plen      = srcmethod.__length;

        // this is the aforementioned proxy method; see the docblock for
        // more information
        dfn[ vis + ' virtual override ' + f ] = ( function( f )
        {
            var retf = function()
            {
                var pmo = this.___$$pmo$$,
                    o   = pmo[ f ];

                // proxy to virtual override from the class we are mixed
                // into, if found; otherwise, proxy to our supertype
                return ( o )
                    ? o.apply( pmo, arguments )
                    : this.__super.apply( this, arguments );
            };

            retf.__length = plen;
            return retf;
        } )( f );

        // this guy bypasses the above virtual override check, which is
        // necessary in certain cases to prevent infinte recursion
        dfn[ vis + ' virtual __$$' + f ] = ( function( method )
        {
            var retf = function()
            {
                return method.apply( this, arguments );
            };

            retf.__length = plen;
            return retf;
        } )( srcmethod );
    }
}


/**
 * Mix trait into the given definition
 *
 * The original object DFN is modified; it is not cloned. TC should be
 * initialized to an empty array; it is used to store context data for
 * mixing in traits and will be encapsulated within a ctor closure (and thus
 * will remain in memory).
 *
 * @param  {Trait}   trait  trait to mix in
 * @param  {Object}  dfn    definition object to merge into
 * @param  {Array}   tc     trait class context
 * @param  {Class}   base   target supertyep
 *
 * @return  {Object}  dfn
 */
function mixin( trait, dfn, tc, base )
{
    // the abstract class hidden within the trait
    var acls = trait.__acls;

    // retrieve the private member name that will contain this trait object
    var iname = addTraitInst( trait, dfn, tc, base );

    // TODO: this should not be necessary for dfn metadata
    dfn[ 'weak virtual ___$$ctor$pre$$' ]  = _fvoid;
    dfn[ 'weak virtual ___$$ctor$post$$' ] = _fvoid;

    // TODO: this is a kluge; generalize and move
    // this ensures __construct is called before __mixin when mixing into
    // the base class
    if ( base === ClassBuilder.ClassBase )
    {
        dfn[ 'virtual override ___$$ctor$post$$' ] = _tctorApply;
        dfn[ 'virtual override ___$$ctor$pre$$' ]  = _fvoid;
    }
    else
    {
        dfn[ 'virtual override ___$$ctor$post$$' ]  = _fvoid;
        dfn[ 'virtual override ___$$ctor$pre$$' ] = _tctorApply;
    }

    // recursively mix in trait's underlying abstract class (ensuring that
    // anything that the trait inherits from is also properly mixed in)
    mixinCls( acls, dfn, iname );
    return dfn;
}


/**
 * Recursively mix in class methods
 *
 * If CLS extends another class, its methods will be recursively processed
 * to ensure that the entire prototype chain is properly proxied.
 *
 * For an explanation of the iname parameter, see the mixin function.
 *
 * @param  {Class}   cls    class to mix in
 * @param  {Object}  dfn    definition object to merge into
 * @param  {string}  iname  trait object private member instance name
 *
 * @return {undefined}
 */
function mixinCls( cls, dfn, iname )
{
    var methods = cls.___$$methods$$;

    mixMethods( methods['public'], dfn, 'public', iname );
    mixMethods( methods['protected'], dfn, 'protected', iname );

    // if this class inherits from another class that is *not* the base
    // class, recursively process its methods; otherwise, we will have
    // incompletely proxied the prototype chain
    var parent = methods['public'].___$$parent$$;
    if ( parent && ( parent.constructor !== ClassBuilder.ClassBase ) )
    {
        mixinCls( parent.constructor, dfn, iname );
    }
}


/**
 * Mix implemented types into destination object
 *
 * The provided destination object will ideally be the `implemented' array
 * of the destination class's meta object.
 *
 * @param  {Class}   cls        source class
 * @param  {Object}  dest_meta  destination object to copy into
 *
 * @return {undefined}
 */
function mixinImpl( cls, dest_meta )
{
    var impl = ClassBuilder.getMeta( cls ).implemented || [],
        i    = impl.length;

    while ( i-- )
    {
        // TODO: this could potentially result in duplicates
        dest_meta.push( impl[ i ] );
    }
}


/**
 * Mix methods from SRC into DEST using proxies
 *
 * @param  {Object}  src    visibility object to scavenge from
 * @param  {Object}  dest   destination definition object
 * @param  {string}  vis    visibility modifier
 * @param  {string}  iname  proxy destination (trait instance)
 *
 * @return  {undefined}
 */
function mixMethods( src, dest, vis, iname )
{
    for ( var f in src )
    {
        if ( !( Object.hasOwnProperty.call( src, f ) ) )
        {
            continue;
        }

        // TODO: generalize
        // __mixin is exclusive to the trait (private-ish, but can be
        // invoked publically internally)
        if ( f === '__mixin' )
        {
            continue;
        }

        // TODO: this is a kluge; we'll use proper reflection eventually,
        // but for now, this is how we determine if this is an actual method
        // vs. something that just happens to be on the visibility object
        if ( !( src[ f ].___$$keywords$$ ) )
        {
            continue;
        }

        var keywords = src[ f ].___$$keywords$$,
            vis      = keywords['protected'] ? 'protected' : 'public';

        // if abstract, then we are expected to provide the implementation;
        // otherwise, we proxy to the trait's implementation
        if ( keywords[ 'abstract' ] && !( keywords[ 'override' ] ) )
        {
            // copy the abstract definition (N.B. this does not copy the
            // param names, since that is not [yet] important); the
            // visibility modified is important to prevent de-escalation
            // errors on override
            dest[ vis + ' weak abstract ' + f ] = src[ f ].definition;
        }
        else
        {
            var vk    = keywords['virtual'],
                virt  = vk ? 'virtual ' : '',
                ovr   = ( keywords['override'] ) ? 'override ' : '',
                pname = ( vk ? '' : 'proxy ' ) + virt + ovr + vis + ' ' + f;

            // if we have already set up a proxy for a field of this name,
            // then multiple traits have defined the same concrete member
            if ( dest[ pname ] !== undefined )
            {
                // TODO: between what traits?
                throw Error( "Trait member conflict: `" + f + "'" );
            }

            // if non-virtual, a normal proxy should do
            if ( !( keywords[ 'virtual' ] ) )
            {
                dest[ pname ] = iname;
                continue;
            }

            // proxy this method to what will be the encapsulated trait
            // object (note that we do not use the proxy keyword here
            // beacuse we are not proxying to a method of the same name)
            dest[ pname ] = ( function( f )
            {
                var retf = function()
                {
                    var pdest = this[ iname ];

                    // invoke the direct method on the trait instance; this
                    // bypasses the virtual override check on the trait
                    // method to ensure that it is invoked without
                    // additional overhead or confusion
                    var ret = pdest[ '__$$' + f ].apply( pdest, arguments );

                    // if the trait returns itself, return us instead
                    return ( ret === pdest )
                        ? this
                        : ret;
                };

                retf.__length = src[ f ].__length;
                return retf;
            } )( f );
        }
    }
}


/**
 * Add concrete trait class to a class instantion list
 *
 * This list---which will be created if it does not already exist---will be
 * used upon instantiation of the class consuming DFN to instantiate the
 * concrete trait classes.
 *
 * Here, `tc' and `to' are understood to be, respectively, ``trait class''
 * and ``trait object''.
 *
 * @param  {Class}   T     trait
 * @param  {Object}  dfn   definition object of class being mixed into
 * @param  {Array}   tc    trait class object
 * @param  {Class}   base  target supertyep
 *
 * @return  {string}  private member into which C instance shall be stored
 */
function addTraitInst( T, dfn, tc, base )
{
    var base_cid = base.__cid;

    // creates a property of the form ___$to$N$M to hold the trait object
    // reference; M is required because of the private member restrictions
    // imposed to be consistent with pre-ES5 fallback
    var iname = '___$to$' + T.__acls.__cid + '$' + base_cid;

    // the trait object array will contain two values: the destination field
    // and the trait to instantiate
    tc.push( [ iname, T ] );

    // we must also add the private field to the definition object to
    // support the object assignment indicated by TC
    dfn[ 'private ' + iname ] = null;

    // create internal trait ctor if not available
    if ( dfn.___$$tctor$$ === undefined )
    {
        // TODO: let's check for inheritance or something to avoid this weak
        // definition (this prevents warnings if there is not a supertype
        // that defines the trait ctor)
        dfn[ 'weak virtual ___$$tctor$$' ] = function() {};
        dfn[ 'virtual override ___$$tctor$$' ] = createTctor( tc, base );
    }

    return iname;
}


/**
 * Trait initialization constructor
 *
 * May be used to initialize all traits mixed into the class that invokes
 * this function. All concrete trait classes are instantiated and their
 * resulting objects assigned to their rsepective pre-determined field
 * names.
 *
 * The MIXINARGS are only useful in the case of parameterized trait.
 *
 * This will lazily create the concrete trait class if it does not already
 * exist, which saves work if the trait is never used.
 *
 * Note that the private symbol used to encapsulate class data must be
 * passed to this function to provide us access to implementation details
 * that we really shouldn't be messing around with. :) In particular, we
 * need access to the protected visibility object, and there is [currently]
 * no API for doing so.
 *
 * @param  {Object}  tc       trait class list
 * @param  {Class}   base     target supertype
 * @param  {Symbol}  privsym  symbol used as key for encapsulated data
 *
 * @return  {undefined}
 */
function tctor( tc, base, privsym )
{
    // instantiate all traits and assign the object to their
    // respective fields
    for ( var t in tc )
    {
        var f = tc[ t ][ 0 ],
            T = tc[ t ][ 1 ],
            C = T.__ccls || ( T.__ccls = createConcrete( T.__acls ) );

        // instantiate the trait, providing it with our protected visibility
        // object so that it has access to our public and protected members
        // (but not private); in return, we will use its own protected
        // visibility object to gain access to its protected members...quite
        // the intimate relationship
        this[ f ] = C( base, this[ privsym ].vis )[ privsym ].vis;

        // this has been previously validated to ensure that it is a
        // function
        this[ f ].__mixin && this[ f ].__mixin.apply(
            this[ f ], T.___$$mixinargs
        );
    }

    // if we are a subtype, be sure to initialize our parent's traits
    this.__super && this.__super( privsym );
};


/**
 * Create trait constructor
 *
 * This binds the generic trait constructor to a reference to the provided
 * trait class list.
 *
 * @param  {Object}  tc    trait class list
 * @param  {Class}   base  target supertype
 *
 * @return  {function()}  trait constructor
 */
function createTctor( tc, base )
{
    return function( privsym )
    {
        return tctor.call( this, tc, base, privsym );
    };
}


function _tctorApply()
{
    this.___$$tctor$$.apply( this, arguments );
}


module.exports = Trait;


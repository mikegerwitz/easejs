/**
 * Provides system for code reuse via traits
 *
 *  Copyright (C) 2014 Mike Gerwitz
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

var AbstractClass = require( __dirname + '/class_abstract' ),
    ClassBuilder  = require( __dirname + '/ClassBuilder' );


function Trait()
{
    switch ( arguments.length )
    {
        case 1:
            return Trait.extend.apply( this, arguments );
            break;
    }
};


Trait.extend = function( dfn )
{
    // we need at least one abstract member in order to declare a class as
    // abstract (in this case, our trait class), so let's create a dummy one
    // just in case DFN does not contain any abstract members itself
    dfn[ 'abstract protected ___$$trait$$' ] = [];

    function TraitType()
    {
        throw Error( "Cannot instantiate trait" );
    };

    // and here we can see that traits are quite literally abstract classes
    var tclass = AbstractClass( dfn );

    TraitType.__trait = true;
    TraitType.__acls  = tclass;
    TraitType.__ccls  = null;

    // traits are not permitted to define constructors
    if ( tclass.___$$methods$$['public'].__construct !== undefined )
    {
        throw Error( "Traits may not define __construct" );
    }

    // invoked to trigger mixin
    TraitType.__mixin = function( dfn )
    {
        mixin( TraitType, dfn );
    };

    return TraitType;
};


Trait.isTrait = function( trait )
{
    return !!( trait || {} ).__trait;
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
        'protected ___$$trait$$': function() {},

        // protected member object
        'private ___$$pmo$$': null,
        __construct: function( pmo )
        {
            this.___$$pmo$$ = pmo;
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

        dfn[ 'public proxy ' + f ] = '___$$pmo$$';
    }

    return acls.extend( dfn );
}


/**
 * Mix trait into the given definition
 *
 * The original object DFN is modified; it is not cloned.
 *
 * @param  {Trait}   trait  trait to mix in
 * @param  {Object}  dfn    definition object to merge into
 *
 * @return  {Object}  dfn
 */
function mixin( trait, dfn )
{
    // the abstract class hidden within the trait
    var acls    = trait.__acls,
        methods = acls.___$$methods$$;

    // retrieve the private member name that will contain this trait object
    var iname = addTraitInst( trait, dfn );

    mixMethods( methods['public'], dfn, 'public', iname );
    mixMethods( methods['protected'], dfn, 'protected', iname );

    return dfn;
}


/**
 * Mix methods from SRC into DEST using proxies
 *
 * @param  {Object}  src    visibility object to scavenge from
 * @param  {Object}  dest   destination definition object
 * @param  {string}  vis    visibility modifier
 * @param  {string}  ianem  proxy destination (trait instance)
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

        // TODO: this is a kluge; we'll use proper reflection eventually,
        // but for now, this is how we determine if this is an actual method
        // vs. something that just happens to be on the visibility object
        if ( !( src[ f ].___$$keywords$$ ) || f === '___$$trait$$' )
        {
            continue;
        }

        // if abstract, then we are expected to provide the implementation;
        // otherwise, we proxy to the trait's implementation
        if ( src[ f ].___$$keywords$$['abstract'] )
        {
            // copy the abstract definition (N.B. this does not copy the
            // param names, since that is not [yet] important)
            dest[ 'weak abstract ' + f ] = src[ f ].definition;
        }
        else
        {
            var pname = vis + ' proxy ' + f;

            // if we have already set up a proxy for a field of this name,
            // then multiple traits have defined the same concrete member
            if ( dest[ pname ] !== undefined )
            {
                // TODO: between what traits?
                throw Error( "Trait member conflict: `" + f + "'" );
            }

            // proxy this method to what will be the encapsulated trait
            // object
            dest[ pname ] = iname;
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
 * @param  {Class}   T    trait
 * @param  {Object}  dfn  definition object of class being mixed into
 *
 * @return  {string}  private member into which C instance shall be stored
 */
function addTraitInst( T, dfn )
{
    var tc    = ( dfn.___$$tc$$ = ( dfn.___$$tc$$ || [] ) ),
        iname = '___$to$' + tc.length;

    // the trait object array will contain two values: the destination field
    // and the trait to instantiate
    tc.push( [ iname, T ] );

    // we must also add the private field to the definition object to
    // support the object assignment indicated by TC
    dfn[ 'private ' + iname ] = null;

    // create internal trait ctor if not available
    if ( dfn.___$$tctor$$ === undefined )
    {
        dfn.___$$tctor$$ = tctor;
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
 * This will lazily create the concrete trait class if it does not already
 * exist, which saves work if the trait is never used.
 *
 * @return  {undefined}
 */
function tctor()
{
    // instantiate all traits and assign the object to their
    // respective fields
    var tc = this.___$$tc$$;
    for ( var t in tc )
    {
        var f = tc[ t ][ 0 ],
            T = tc[ t ][ 1 ],
            C = T.__ccls || ( T.__ccls = createConcrete( T.__acls ) );

        // TODO: pass protected visibility object once we create
        // trait class ctors
        this[ f ] = C();
    }
};


module.exports = Trait;

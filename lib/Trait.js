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

var AbstractClass = require( __dirname + '/class_abstract' );


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
    dfn[ 'abstract protected __$$trait$$' ] = [];

    function TraitType()
    {
        throw Error( "Cannot instantiate trait" );
    };

    // and here we can see that traits are quite literally abstract classes
    var tclass = AbstractClass( dfn );

    TraitType.__trait = true;
    TraitType.__acls  = tclass;
    TraitType.__ccls  = createConcrete( tclass );

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
    // start by providing a concrete implementation for our dummy method
    var dfn = {
        'protected __$$trait$$': function() {},
    };

    // TODO: everything else

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
        methods = acls.___$$methods$$,
        pub     = methods['public'];

    // retrieve the private member name that will contain this trait object
    var iname = addTraitInst( trait.__ccls, dfn );

    // TODO: protected; ignore abstract
    for ( var f in pub )
    {
        if ( !( Object.hasOwnProperty.call( pub, f ) ) )
        {
            continue;
        }

        // TODO: this is a kluge; we'll use proper reflection eventually,
        // but for now, this is how we determine if this is an actual public
        // method vs. something that just happens to be on the public
        // visibility object
        if ( !( pub[ f ].___$$keywords$$ ) )
        {
            continue;
        }

        var pname = 'public proxy ' + f;

        // if we have already set up a proxy for a field of this name, then
        // multiple traits have defined the same concrete member
        if ( dfn[ pname ] !== undefined )
        {
            // TODO: between what traits?
            throw Error( "Trait member conflict: `" + f + "'" );
        }

        // proxy this method to what will be the encapsulated trait object
        dfn[ pname ] = iname;
    }

    return dfn;
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
 * @param  {Class}   C    concrete trait class
 * @param  {Object}  dfn  definition object of class being mixed into
 *
 * @return  {string}  private member into which C instance shall be stored
 */
function addTraitInst( C, dfn )
{
    var tc    = ( dfn.___$$tc$$ = ( dfn.___$$tc$$ || [] ) ),
        iname = '___$to$' + tc.length;

    // the trait object array will contain two values: the destination field
    // and the class to instantiate
    tc.push( [ iname, C ] );

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
            C = tc[ t ][ 1 ];

        // TODO: pass protected visibility object once we create
        // trait class ctors
        this[ f ] = C();
    }
};


module.exports = Trait;

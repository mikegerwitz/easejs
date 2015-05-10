/**
 * Tests extending traits from classes
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

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut           = this.require( 'Trait' );
        this.Class         = this.require( 'class' );
    },


    /**
     * Normally, there are no restrictions on what class a trait may be
     * mixed into.  When ``extending'' a class, we would expect intuitively
     * that this behavior would remain consistent.
     */
    'Trait T extending class C can be mixed into C': function()
    {
        var C = this.Class( {} ),
            T = this.Sut.extend( C, {} );

        this.assertDoesNotThrow( function()
        {
            C.use( T )();
        } );
    },


    /**
     * Restrictions emerge once a disjoint type D attempts to mix in a trait
     * T extending class C.  When C is ``extended'', we are
     * effectively extracting and implementing interfaces representing its
     * public and protected members---this has all the same effects that one
     * would expect from implementing an interface.  However, the act of
     * extension implies a tight coupling between T and C: we're not just
     * expecting a particular interface; we're also expecting the mixee to
     * behave in a certain manner, just as a subtype of C would expect.
     *
     * Traits extending classes therefore behave like conventional subtypes
     * extending their parents, but with a greater degree of
     * flexibility.  We would not expect to be able to use a subtype of C as
     * if it were a disjoint type D, because they are different types: even
     * if they share an identical interface, their intents are
     * distinct.  This is the case here.
     */
    'Trait T extending class C cannot be mixed into disjoint class D':
    function()
    {
        var C = this.Class( {} ),
            D = this.Class( {} ),
            T = this.Sut.extend( C, {} );

        this.assertThrows( function()
        {
            D.use( T )();
        }, TypeError );
    },


    /**
     * Just as some class D' extending supertype D is of both types D' and
     * D, and a trait T implementing interface I is of both types T and I,
     * we would expect that a trait T extending C would be of both types T
     * _and_ C, since T is effectively implementing C's interface.
     */
    'Trait T extending class C is of both types T and C': function()
    {
        var C    = this.Class( {} ),
            T    = this.Sut.extend( C, {} ),
            inst = C.use( T )();

        this.assertOk( this.Class.isA( T, inst ) );
        this.assertOk( this.Class.isA( C, inst ) );
    },


    /**
     * Since a subtype C2 is, by definition, also of type C, we would expect
     * that any traits that are valid to be mixed into type C would also be
     * valid to be mixed into subtypes of C.  This permits trait
     * polymorphism in the same manner as classes and interfaces.
     */
    'Trait T extending class C can be mixed into C subtype C2': function()
    {
        var C  = this.Class( {} ),
            C2 = C.extend( {} ),
            T  = this.Sut.extend( C, {} );

        this.assertDoesNotThrow( function()
        {
            C2.use( T )();
        } );
    },


    /**
     * This is a corollary of the above associations.
     */
    'Trait T extending subtype C2 cannot be mixed into supertype C':
    function()
    {
        var C  = this.Class( {} ),
            C2 = C.extend( {} ),
            T  = this.Sut.extend( C2, {} );

        this.assertThrows( function()
        {
            C.use( T )();
        }, TypeError );
    },


    /**
     * The trait `#extend' method mirrors the syntax of classes: the first
     * argument is the class to be extended, and the second is the actual
     * definition.
     */
    'Trait definition can follow class extension': function()
    {
        var a = ['a'],
            b = ['b'];

        var C = this.Class( {
                foo: function() { return a; }
            } ),
            T = this.Sut.extend( C, {
                    bar: function() { return b; }
            } );

        var inst = C.use( T )();

        this.assertStrictEqual( inst.foo(), a );
        this.assertStrictEqual( inst.bar(), b );
    },


    /**
     * This is a corollary, but is still worth testing for assurance.
     *
     * We already stated that a trait Tb extending C's subtype C2 cannot be
     * mixed into C, because C is not of type C2.  But Ta extending C can be
     * mixed into C2, because C2 _is_ of type C.  Therefore, both of these
     * traits should be able to co-mix in the latter situation, but not the
     * former.
     */
    'Trait Ta extending C and Tb extending C2 cannot co-mix': function()
    {
        var C  = this.Class( 'C' ).extend( { _a: null } ),
            C2 = this.Class( 'C2' ).extend( C, { _b: null } ),
            Ta = this.Sut.extend( C, {} ),
            Tb = this.Sut.extend( C2, {} );

        // this is _not_ okay
        this.assertThrows( function()
        {
            C.use( Ta ).use( Tb )();
        } );

        // but this is, since Tb extends C2 itself, and Ta extends C2's
        // supertype
        this.assertDoesNotThrow( function()
        {
            C2.use( Tb ).use( Ta )();
        } );
    },


    /**
     * The `#extend' method for traits, when extending a class, must not
     * accept more than two arguments; otherwise, there may be a bug.  It
     * does not make sense to accept more arguments, since traits can only
     * extend a single class.
     *
     * The reason?  Well, as a corollary of the above, given types
     * C_0,...,C_n to extend: C_x, 0<=x<n, must be equal to or a subtype of
     * each C_i, 0<=x≠i<n, or the types are incompatible.  In that case, the
     * trait could just extend the subtype that has each other type C_i in
     * its lineage, making multiple specifications unnecessary.
     *
     * Does that mean that it's not possible to combine two disjoint classes
     * into one API that is a subtype of both?  Yes, it does: that's
     * multiple inheritance; use interfaces or traits, both of which are
     * designed to solve this problem properly (the latter most closely).
     */
    'Trait class extension cannot supply more than two arguments':
    function()
    {
        var _self = this;

        this.assertThrows( function()
        {
            // extra argument
            _self.Sut.extend( _self.Class( {} ), {}, {} );
        } );
    },
} );

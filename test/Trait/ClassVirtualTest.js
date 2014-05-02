/**
 * Tests overriding virtual class methods using mixins
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
 *
 * These tests vary from those in VirtualTest in that, rather than a class
 * overriding a virtual method defined within a trait, a trait is overriding
 * a method in the class that it is mixed into. In particular, since
 * overrides require that the super method actually exist, this means that a
 * trait must implement or extend a common interface.
 *
 * It is this very important (and powerful) system that allows traits to be
 * used as stackable modifications, similar to how one would use the
 * decorator pattern (but more tightly coupled).
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut           = this.require( 'Trait' );
        this.Class         = this.require( 'class' );
        this.AbstractClass = this.require( 'class_abstract' );
        this.Interface     = this.require( 'interface' );
    },


    /**
     * A trait may implement an interface I for a couple of reasons: to have
     * the class mixed into be considered to of type I and to override
     * methods. But, regardless of the reason, let's start with the
     * fundamentals.
     */
    'Traits may implement an interface': function()
    {
        var _self = this;

        // simply make sure that the API is supported; nothing more.
        this.assertDoesNotThrow( function()
        {
           _self.Sut.implement( _self.Interface( {} ) ).extend( {} );
        } );
    },


    /**
     * We would expect that the default behavior of implementing an
     * interface I into a trait would create a trait with all abstract
     * methods defined by I.
     */
    'Traits implementing interfaces define abstract methods': function()
    {
        var I = this.Interface( { foo: [], bar: [] } ),
            T = this.Sut.implement( I ).extend( {} );

        var Class         = this.Class,
            AbstractClass = this.AbstractClass;

        // T should contain both foo and bar as abstract methods, which we
        // will test indirectly in the assertions below

        // should fail because of abstract foo and bar
        this.assertThrows( function()
        {
            Class.use( T ).extend( {} );
        } );

        // should succeed, since we can have abstract methods within an
        // abstract class
        this.assertDoesNotThrow( function()
        {
            AbstractClass.use( T ).extend( {} );
        } );

        // one remaining abstract method
        this.assertDoesNotThrow( function()
        {
            AbstractClass.use( T ).extend( { foo: function() {} } );
        } );

        // both concrete
        this.assertDoesNotThrow( function()
        {
            Class.use( T ).extend(
            {
                foo: function() {},
                bar: function() {},
            } );
        } );
    },


    /**
     * Just as classes implementing interfaces may choose to immediately
     * provide concrete definitions for the methods declared in the
     * interface (instead of becoming an abstract class), so too may traits.
     */
    'Traits may provide concrete methods for interfaces': function()
    {
        var called = false;

        var I = this.Interface( { foo: [] } ),
            T = this.Sut.implement( I ).extend(
            {
                foo: function()
                {
                    called = true;
                },
            } );

        var Class = this.Class;
        this.assertDoesNotThrow( function()
        {
            // should invoke concrete foo; class definition should not fail,
            // because foo is no longer abstract
            Class.use( T ).extend( {} )().foo();
        } );

        this.assertOk( called );
    },


    /**
     * Instances of class C mixing in some trait T implementing I will be
     * considered to be of type I, since any method of I would either be
     * defined within T, or would be implicitly abstract in T, requiring its
     * definition within C; otherwise, C would have to be declared astract.
     */
    'Instance of class mixing in trait implementing I is of type I':
    function()
    {
        var I = this.Interface( {} ),
            T = this.Sut.implement( I ).extend( {} );

        this.assertOk(
            this.Class.isA( I, this.Class.use( T ).extend( {} )() )
        );
    },


    /**
     * The API for multiple interfaces should be the same for traits as it
     * is for classes.
     */
    'Trait can implement multiple interfaces': function()
    {
        var Ia = this.Interface( {} ),
            Ib = this.Interface( {} ),
            T  = this.Sut.implement( Ia, Ib ).extend( {} ),
            o  = this.Class.use( T ).extend( {} )();

        this.assertOk( this.Class.isA( Ia, o ) );
        this.assertOk( this.Class.isA( Ib, o ) );
    },


    /**
     * This is a concept borrowed from Scala: consider class C and trait T,
     * both implementing interface I which declares method M. T should be
     * able to override C.M so long as it is concrete, but to do so, we need
     * some way of telling ease.js that we are overriding at time of mixin;
     * otherwise, override does not make sense, because I.M is clearly
     * abstract and there is nothing to override.
     */
    'Mixin can override virtual concrete method defined by interface':
    function()
    {
        var called = false,
            I      = this.Interface( { foo: [] } );

        var T = this.Sut.implement( I ).extend(
        {
            // the keyword combination `abstract override' indicates that we
            // should override whatever concrete implementation was defined
            // before our having been mixed in
            'abstract override foo': function()
            {
                called = true;
            },
        } );

        var _self = this;
        var C = this.Class.implement( I ).extend(
        {
            // this should be overridden by the mixin and should therefore
            // never be called (for __super tests, see LinearizationTest)
            'virtual foo': function()
            {
                _self.fail( false, true,
                    "Concrete class method was not overridden by mixin"
                );
            },
        } );

        // mixing in a trait atop of C should yield the results described
        // above due to the `abstract override' keyword combination
        C.use( T )().foo();
        this.assertOk( called );
    },


    /**
     * Virtual methods for traits are handled via a series of proxy methods
     * that determine, at runtime (as opposed to when the class is created),
     * where the call should go. (At least that was the implementation at
     * the time this test was written.) This test relies on the proper
     * parameter metadata being set on those proxy methods so that the
     * necessary length requirements can be validated.
     *
     * This was a bug in the initial implemenation: the above tests did not
     * catch it because the virtual methods had no arguments. The initial
     * problem was that, since __length was not defined on the generated
     * method that was recognized as the override, it was always zero, which
     * always failed if there were any arguments on the virtual method. The
     * reverse case was also a problem, but it didn't manifest as an
     * error---rather, it did *not* error when it should have.
     *
     * Note the instantiation in these cases: this is because the trait
     * implementation lazily performs the mixin on first use.
     */
    'Subtype must meet compatibility requirements of virtual trait method':
    function()
    {
        var _self = this;

        var C = this.Class.use(
            this.Sut( { 'virtual foo': function( a, b ) {} } )
        );

        this.assertThrows( function()
        {
            // does not meet param requirements (note the
            // instantiation---traits defer processing until they are used)
            C.extend( { 'override foo': function( a ) {} } )();
        } );

        this.assertDoesNotThrow( function()
        {
            // does not meet param requirements (note the
            // instantiation---traits defer processing until they are used)
            C.extend( { 'override foo': function( a, b ) {} } )();
        } );
    },
} );

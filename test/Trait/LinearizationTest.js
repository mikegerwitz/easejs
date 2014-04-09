/**
 * Tests trait/class linearization
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
 * GNU ease.js adopts Scala's concept of `linearization' with respect to
 * resolving calls to supertypes; the tests that follow provide a detailed
 * description of the concept, but readers may find it helpful to read
 * through the ease.js manual or Scala documentation.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut       = this.require( 'Trait' );
        this.Class     = this.require( 'class' );
        this.Interface = this.require( 'interface' );
    },


    /**
     * When a class mixes in a trait that defines some method M, and then
     * overrides it as M', then this.__super within M' should refer to M.
     * Note that this does not cause any conflicts with any class supertypes
     * that may define a method of the same name as M, because M must have
     * been an override, otherwise an error would have occurred.
     */
    'Class super call refers to mixin that is part of a class definition':
    function()
    {
        var _self   = this,
            scalled = false;

        var T = this.Sut(
        {
            // after mixin, this should be the super method
            'virtual public foo': function()
            {
                scalled = true;
            },
        } );

        this.Class.use( T ).extend(
        {
            // overrides mixed-in foo
            'override public foo': function()
            {
                // should invoke T.foo
                try
                {
                    this.__super();
                }
                catch ( e )
                {
                    _self.fail( false, true,
                        "Super invocation failure: " + e.message
                    );
                }
            },
        } )().foo();

        this.assertOk( scalled );
    },


    /**
     * If a trait overrides a method of a class that it is mixed into, then
     * super calls within the trait method should resolve to the class
     * method.
     */
    'Mixin overriding class method has class method as super method':
    function()
    {
        var _self = this;

        var expected = {},
            I        = this.Interface( { foo: [] } );

        var T = this.Sut.implement( I ).extend(
        {
            // see ClassVirtualTest case for details on this
            'abstract override foo': function()
            {
                // should reference C.foo
                return this.__super( expected );
            },
        } );

        var priv_expected = Math.random();

        var C = this.Class.implement( I ).extend(
        {
            // asserting on this value will ensure that the below method is
            // invoked in the proper context
            'private _priv': priv_expected,

            'virtual foo': function( given )
            {
                _self.assertEqual( priv_expected, this._priv );
                return given;
            },
        } );

        this.assertStrictEqual( C.use( T )().foo(), expected );
    },


    /**
     * Similar in spirit to the previous test: a supertype with a mixin
     * should be treated just as any other class.
     *
     * Another way of phrasing this test is: "traits are stackable".
     * Importantly, this also means that `virtual' must play nicely with
     * `abstract override'.
     */
    'Mixin overriding another mixin method M has super method M': function()
    {
        var called = {};

        var I = this.Interface( { foo: [] } );

        var Ta = this.Sut.implement( I ).extend(
        {
            'virtual abstract override foo': function()
            {
                called.a = true;
                this.__super();
            },
        } );

        var Tb = this.Sut.implement( I ).extend(
        {
            'abstract override foo': function()
            {
                called.b = true;
                this.__super();
            },
        } );

        this.Class.implement( I ).extend(
        {
            'virtual foo': function() { called.base = true; },
        } ).use( Ta ).use( Tb )().foo();

        this.assertOk( called.a );
        this.assertOk( called.b );
        this.assertOk( called.base );
    },


    /**
     * Essentially the same as the above test, but ensures that a mixin can
     * be stacked multiple times atop of itself with no ill effects. We
     * assume that all else is working (per the previous test).
     *
     * The number of times we stack the mixin is not really relevant, so
     * long as it is >= 2; we did 3 here just for the hell of it to
     * demonstrate that there is ideally no limit.
     */
    'Mixin can be mixed in atop of itself': function()
    {
        var called     = 0,
            calledbase = false;

        var I = this.Interface( { foo: [] } );

        var T = this.Sut.implement( I ).extend(
        {
            'virtual abstract override foo': function()
            {
                called++;
                this.__super();
            },
        } );

        this.Class.implement( I ).extend(
        {
            'virtual foo': function() { calledbase = true; },
        } ).use( T ).use( T ).use( T )().foo();


        // mixed in thrice, so it should have stacked thrice
        this.assertEqual( called, 3 );
        this.assertOk( calledbase );
    },
} );


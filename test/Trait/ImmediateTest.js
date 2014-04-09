/**
 * Tests immediate definition/instantiation
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
        this.Sut   = this.require( 'Trait' );
        this.Class = this.require( 'class' );
    },


    /**
     * In our most simple case, mixing a trait into an empty base class and
     * immediately invoking the resulting partial class (without explicitly
     * extending) should have the effect of instantiating a concrete version
     * of the trait (so long as that is permitted). While this test exists
     * to ensure consistency throughout the system, it may be helpful in
     * situations where a trait is useful on its own.
     *
     * Note that we cannot simply use Class.use( T ), because this sets up a
     * concrete class definition, not an immediate mixin.
     */
    'Invoking partial class after mixin instantiates': function()
    {
        var called = false;

        var T = this.Sut(
        {
            'public foo': function()
            {
                called = true;
            },
        } );

        // mixes T into an empty base class and instantiates
        this.Class.extend( {} ).use( T )().foo();
        this.assertOk( called );
    },


    /**
     * This is the most useful and conventional form of mixin---runtime,
     * atop of an existing class. In this case, we provide a short-hand form
     * of instantiation to avoid the ugly pattern of `.extend( {} )()'.
     */
    'Can invoke partial mixin atop of non-empty base': function()
    {
        var called_foo = false,
            called_bar = false;

        var C = this.Class(
        {
            'public foo': function() { called_foo = true; },
        } );

        var T = this.Sut(
        {
            'public bar': function() { called_bar = true; },
        } );

        // we must ensure not only that we have mixed in the trait, but that
        // we have also maintained C's interface
        var inst = C.use( T )();
        inst.foo();
        inst.bar();

        this.assertOk( called_foo );
        this.assertOk( called_bar );
    },


    /**
     * Ensure that the partial invocation shorthand is equivalent to the
     * aforementioned `.extend( {} ).apply( null, arguments )'.
     */
    'Partial arguments are passed to class constructor': function()
    {
        var given    = null,
            expected = { foo: 'bar' };

        var C = this.Class(
        {
            __construct: function() { given = arguments; },
        } );

        var T = this.Sut( {} );

        C.use( T )( expected );
        this.assertStrictEqual( given[ 0 ], expected );
    },
} );


/**
 * Tests named trait definitions
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
     * If a trait is not given a name, then converting it to a string should
     * indicate that it is anonymous. Further, to disambiguate from
     * anonymous classes, we should further indicate that it is a trait.
     *
     * This test is fragile in the sense that it tests for an explicit
     * string: this is intended, since some developers may rely on this
     * string (even though they really should use Trait.isTrait), and so it
     * should be explicitly documented.
     */
    'Anonymous trait is properly indicated when converted to string':
    function()
    {
        var given = this.Sut( {} ).toString();
        this.assertEqual( given, '(Trait)' );
    },


    /**
     * Analagous to named classes: we should provide the name when
     * converting to a string to aid in debugging.
     */
    'Named trait contains name when converted to string': function()
    {
        var name = 'FooTrait',
            T    = this.Sut( name, {} );

        this.assertOk( T.toString().match( name ) );
    },


    /**
     * We assume that, if two or more arguments are provided, that the
     * definition is named.
     */
    'Named trait definition cannot contain zero or more than two arguments':
    function()
    {
        var Sut = this.Sut;
        this.assertThrows( function() { Sut(); } );
        this.assertThrows( function() { Sut( 1, 2, 3 ); } );
    },


    /**
     * Operating on the same assumption as the above test.
     */
    'First argument in named trait definition must be a string':
    function()
    {
        var Sut = this.Sut;
        this.assertThrows( function()
        {
            Sut( {}, {} );
        } );
    },
} );

/**
 * Tests named trait definitions
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

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut       = this.require( 'Trait' );
        this.Class     = this.require( 'class' );
        this.Interface = this.require( 'interface' );
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


    /**
     * Just as is the case with classes, providing only a name for the trait
     * should create a staging object with which subsequent calls may be
     * chained, just as if those calls were made on Trait directly. The
     * difference is that the name shall propagate.
     */
    'Providing only trait name creates staging object': function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            // this does not create a trait, but it should be acceptable
            // just as Class( "Foo" ) is
            Sut( "Foo" );
        } );
    },


    /**
     * The named trait staging object should permit direct extension using
     * an extend method, which should do the same thing as Trait.extend.
     */
    'Can extend named trait staging object': function()
    {
        var Sut      = this.Sut,
            expected = {},
            name     = "Foo",
            T        = null;

        this.assertDoesNotThrow( function()
        {
            // this does not create a trait, but it should be acceptable
            // just as Class( "Foo" ) is
            T = Sut( name )
                .extend( { foo: function() { return expected; } } );
        } );

        // ensure that extending worked as expected
        this.assertStrictEqual(
            this.Class( {} ).use( T )().foo(),
            expected
        );

        // ensure that trait was properly named
        this.assertOk( T.toString().match( name ) );
    },


    /**
     * The implement method on the named staging object should work just as
     * Trait.implement.
     */
    'Can implement interface using named trait staging object':
    function()
    {

        var Sut      = this.Sut,
            expected = {},
            name     = "Foo",
            I        = this.Interface( {} ),
            I2       = this.Interface( {} ),
            T        = null;

        this.assertDoesNotThrow( function()
        {
            // this does not create a trait, but it should be acceptable
            // just as Class( "Foo" ) is
            T = Sut( "Foo" )
                .implement( I, I2 )
                .extend( {} );
        } );

        // ensure that implement worked as intended
        var inst = this.Class( {} ).use( T )();
        this.assertOk( this.Class.isA( I, inst ) );
        this.assertOk( this.Class.isA( I2, inst ) );

        // ensure that trait was properly named
        this.assertOk( T.toString().match( name ) );
    },
} );

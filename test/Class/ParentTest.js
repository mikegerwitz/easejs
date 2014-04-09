/**
 * Tests class parent invocation
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
 * TODO: This should test the appropriate functionality directly, not
 * through the class module.
 */

require( 'common' ).testCase(
{
    setUp: function()
    {
        this.Sut = this.require( 'class' );
    },


    /**
     * An overridden parent method should never be invoked without
     * explicitly requesting such.
     */
    'Subtype does not invoke overridden parent method by default':
    function()
    {
        var called = false;

        this.Sut( { 'virtual foo': function() { called = true; } } )
            .extend( { 'override foo': function() {} } )
            ().foo();

        this.assertOk( !called );
    },


    /**
     * We provide a __super reference for invoking the parent method; all
     * arguments should be forwarded.
     */
    'Subtype can invoke parent method with arguments': function()
    {
        var args     = null,
            expected1 = "foobar",
            expected2 = "baz";

        this.Sut( { 'virtual foo': function( a, b ) { args = [ a, b ]; } } )
            .extend( {
                'override foo': function( a, b ) { this.__super( a, b ); }
            } )
            ().foo( expected1, expected2 );

        this.assertNotEqual( args, null );
        this.assertEqual( args[ 0 ], expected1 );
        this.assertEqual( args[ 1 ], expected2 );
    },
} );

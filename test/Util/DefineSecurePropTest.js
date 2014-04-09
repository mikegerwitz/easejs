/**
 * Tests util.defineSecureProp
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
        this.Sut = this.require( 'util' );

        this.expected = ( ( Object.defineProperty instanceof Function )
            ? false
            : true
        );

        this.fallback = this.Sut.definePropertyFallback();

        // IE 8 will fall back on first failure because of its partial
        // implementation (DOM elements only...!)
        if ( !( this.expected ) && this.fallback )
        {
            try
            {
                this.Sut.definePropertyFallback( false );
                this.Sut.defineSecureProp( {}, 'foo', 1 );

                // If the fallback was changed on us, then there was a
                // problem (and this is likely IE8); change the value we're
                // expecting so our tests don't fail.
                if ( this.Sut.definePropertyFallback() === true )
                {
                    this.expected = true;
                }
            }
            catch ( e ) {}
        }

        this.descRestrictionCheck = function( type, expected )
        {
            this.fallback && this.skip();

            var obj = {};
            this.Sut.defineSecureProp( obj, 'foo', null );
            this.assertEqual(
                Object.getOwnPropertyDescriptor( obj, 'foo' )[ type ],
                expected
            );
        };

        // TODO: this is only necessary because we use global state; get rid
        // of that state.
        this.forceFallback = function( c )
        {
            this.Sut.definePropertyFallback( true );
            c.call( this );
            this.Sut.definePropertyFallback( this.fallback );
        };
    },


    /**
     * The definition of ``secure'' fields depends on ECMAScript 5.
     */
    'definePropertyFallback returns whether secure definition is supported':
    function()
    {
        this.assertEqual(
            this.expected,
            this.Sut.definePropertyFallback()
        );
    },


    /**
     * Permits method chaining.
     */
    'definePropertyFallback returns util when used as a setter': function()
    {
        this.assertStrictEqual(
            this.Sut.definePropertyFallback( this.fallback ),
            this.Sut
        );
    },


    /**
     * The data created by the defineSecureProp function should exist
     * regardless of whether or not the concept of a ``secure'' property is
     * supported by the environment.
     */
    'Defining secure prop creates field with given value on given object':
    function()
    {
        var obj = {},
            val = { bar: 'baz' };

        this.Sut.defineSecureProp( obj, 'foo', val );
        this.assertStrictEqual( obj.foo, val );
    },


    /**
     * Our assertions below are going to use the data from the following
     * method. We're not going to test directly whether they're writable,
     * etc, because different engines may have different interpretations at
     * this stage. (Or it may not yet be implemented.) Therefore, we'll
     * simply see if what we requested has been set, and leave the problems
     * up to the engine developers.
     *
     * This is a case of ensuring we're testing our own functionality---we
     * do not want to test engine functionality.
     */
    'Secure property is not writable': function()
    {
        this.descRestrictionCheck( 'writable', false );
    },
    'Secure property is not configurable': function()
    {
        this.descRestrictionCheck( 'configurable', false );
    },
    'Secure property is not enumerable': function()
    {
        this.descRestrictionCheck( 'enumerable', false );
    },


    /**
     * These tests the same as the above set of tests, but forces a fallback
     * to pre-ES5 functionality.
     */
    'Defining secure prop creates field and value when falling back':
    function()
    {
        this.forceFallback( function()
        {
            var obj = {},
                val = { bar: 'baz' };

            this.Sut.defineSecureProp( obj, 'foo', val );
            this.assertStrictEqual( obj.foo, val );
        } );
    },
    'Secure property is writable when falling back': function()
    {
        this.forceFallback( function()
        {
            this.descRestrictionCheck( 'writable', true );
        } );
    },
    'Secure property is configurable when falling back': function()
    {
        this.forceFallback( function()
        {
            this.descRestrictionCheck( 'configurable', true );
        } );
    },
    'Secure property is enumerable when falling back': function()
    {
        this.forceFallback( function()
        {
            this.descRestrictionCheck( 'enumerable', true );
        } );
    },
} );

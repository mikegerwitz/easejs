/**
 * Tests util.copy
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

        // are getters/setters supported?
        this.hasGetSet = !( this.Sut.definePropertyFallback() );
    },


    /**
     * Just a basic copy test: ensure the values are copied by reference.
     */
    'Values are copied to destination object by reference': function()
    {
        var src = {
                a: 'a',
                b: 2,
                c: true,
                d: false,
                e: undefined,
                f: null,
                g: function() {},
            },
            dest = {}
        ;

        this.Sut.copyTo( dest, src );

        for ( var key in src )
        {
            this.assertStrictEqual( src[ key ], dest[ key ] );
        }
    },


    /**
     * Same concept as above, but with getters/setters
     */
    'Getters and setters are copied to destination object by reference':
    function()
    {
        // no use in performing the test if the engine doesn't support it
        if ( !( this.hasGetSet ) )
        {
            this.skip();
        }

        var get  = function() {},
            set  = function() {},
            src  = {},
            dest = {},

            result = null
        ;

        Object.defineProperty( src, 'foo', {
            get: get,
            set: set,

            // so copy can actually see the property
            enumerable: true,
        } );

        this.Sut.copyTo( dest, src );

        // look up the getter/setter in dest
        result = Object.getOwnPropertyDescriptor( dest, 'foo' );

        // check getter
        this.assertStrictEqual( result.get, get,
            "Getter is copied by reference by default"
        );

        // check setter
        this.assertDeepEqual( result.set, set,
            "Setter is copied by reference by default"
        );
    },


    /**
     * For convenience (and a convention familar to uses of, notably, C
     * APIs).
     */
    'Copy operation returns destination object': function()
    {
        var dest = {};
        this.assertStrictEqual( this.Sut.copyTo( dest, {} ), dest );
    },


    /**
     * This is pretty self-explanatory.
     */
    'Throws error if source or dest are not provided': function()
    {
        var copyTo = this.Sut.copyTo;

        this.assertThrows( function()
        {
            copyTo();
        }, TypeError, "Dest parameter is required" );

        this.assertThrows( function()
        {
            copyTo( 'bla', {} );
        }, TypeError, "Dest parameter is required to be an object" );

        this.assertThrows( function()
        {
            copyTo( {} );
        }, TypeError, "Src parameter is required" );

        this.assertThrows( function()
        {
            copyTo( {}, 'foo' );
        }, TypeError, "Src parameter is required to be an object" );
    },


    /**
     * For convenience, let's support a deep copy as well, just in case they
     * don't want to copy everything by reference.
     */
    'Deep copies are supported': function()
    {
        var src  = { foo: [ 1, 2, 3 ] },
            dest = this.Sut.copyTo( {}, src, true );

        // copied values should be equal by value...
        this.assertDeepEqual( src.val, dest.val,
            "Copied values should be comparitively equal with deep copy"
        );

        // ...but not by reference
        this.assertNotStrictEqual( src.foo, dest.foo,
            "Copied values should not be the same object after deep copy"
        );
    },
} );

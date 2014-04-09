/**
 * Tests util.clone
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
    },


    /**
     * Cloning is intended to duplicate objects to avoid shared references.
     */
    'Cloned array is not the same object as the original': function()
    {
        var arr = [ 1, 2, 3 ];
        this.assertNotStrictEqual( this.Sut.clone( arr ), arr );
    },


    /**
     * Same concept as above test.
     */
    'Cloned object is not the same object as the original': function()
    {
        var obj = { foo: 'bar' };
        this.assertNotStrictEqual( this.Sut.clone( obj ), obj );
    },


    /**
     * Array data should be cloned such that it strictly matches the
     * original; this means a shallow clone is the default.
     */
    'Cloned array data mirrors original (shallow clone)': function()
    {
        var arr  = [ 1, '2', { three: 3 }, [ 4 ] ],
            arrc = this.Sut.clone( arr );

        for ( var i = 0, len = arr.length; i < len; i++ )
        {
            // note that this implies a shallow clone
            this.assertStrictEqual( arr[ i ], arrc[ i ] );
        }
    },


    /**
     * Same concept as the above test.
     */
    'Cloned object data mirrors original (shallow clone)': function()
    {
        var obj  = { a: 1, b: [ 2 ], c: { three: 3 }, d: '4' },
            objc = this.Sut.clone( obj );

        for ( var f in obj )
        {
            // note that this implies a shallow clone
            this.assertStrictEqual( obj[ f ], objc[ f ] );
        }
    },


    /**
     * Same concept as a shallow clone, but we must recursively check for
     * data equality since all objects should have been recursively cloned.
     */
    'Deeply cloned array data mirrors original': function()
    {
        // TODO: we could benefit from a deepClone method instead of a
        // cryptic second argument
        var arr  = [ [ 1, 2 ], [ 3, 4 ], [ 5, [ 6, 7 ] ], { a: 1 } ],
            arrc = this.Sut.clone( arr, true );

        this.assertDeepEqual( arr, arrc );

        // there should be no shared references (yes, we're only checking
        // one level here...)
        for ( var i = 0, len = arr.length; i < len; i++ )
        {
            this.assertNotStrictEqual( arr[ i ] , arrc[ i ] );
        }
    },


    /**
     * Same concept as above test.
     */
    'Deeply cloned object data mirrors original': function()
    {
        var obj  = { a: [ 1 ], b: [ 2 ], c: { d: 3 } },
            objc = this.Sut.clone( obj, true );

        this.assertDeepEqual( obj, objc );

        // there should be no shared references
        for ( var f in obj )
        {
            this.assertNotStrictEqual( obj[ f ], objc[ f ] );
        }
    },


    /**
     * "Cloning" functions doesn't necessarily make sense, but it can,
     * depending on how you think about it. We can do a toSource() in many
     * circumstances and create a new function from that; but what's the
     * point? It still does the same thing. As such, functions will not be
     * cloned---they'll be returned by reference. This has the obvious
     * downside that any properties set on the function itself are not
     * cloned, but this is not a current consideration for ease.js.
     */
    'Functions are returned by reference, not cloned': function()
    {
        var func = function() {},
            obj  = { foo: func };

        this.assertStrictEqual( func, this.Sut.clone( obj, true ).foo );
    },


    /**
     * Primitives cannot be cloned, so we should expect that they are simply
     * returned
     */
    'Primitives are returned by clone': function()
    {
        // we don't try NaN here because NaN != NaN; we'll try it separately
        var prim = [ null, 1, true, false, undefined ],
            i    = prim.length;

        while ( i-- )
        {
            var val = prim[ i ];

            this.assertEqual( val, this.Sut.clone( val ),
                'Failed to clone primitive value: ' + val
            );
        }

        // test NaN separately
        this.assertOk( isNaN( this.Sut.clone( NaN ) ) );
    },
} );

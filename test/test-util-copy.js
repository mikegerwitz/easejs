/**
 * Tests util.copy
 *
 *  Copyright (C) 2011 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 */

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' ),

    copyTo  = util.copyTo,
    get_set = !( util.definePropertyFallback() )
;


/**
 * Just a basic copy test. Ensure the values are copied by reference.
 */
( function testCopiesReferencesToDestinationObject()
{
    var src = {
            a: 'a',
            b: 2,
            c: true,
            d: false,
            e: undefined,
            d: null,
            f: function() {},
        },
        dest = {}
    ;

    copyTo( dest, src );

    for ( var key in src )
    {
        assert.deepEqual( src[ key ], dest[ key ],
            "Copies by reference by default"
        );
    }
} )();


/**
 * Same concept as above, but with getters/setters
 */
( function testGettersAndSettersAreCopiedByReferenceToDestinationObject()
{
    // no use in performing the test if the engine doesn't support it
    if ( !get_set )
    {
        return;
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

    copyTo( dest, src );

    // look up the getter/setter in dest
    result = Object.getOwnPropertyDescriptor( dest, 'foo' );

    // check getter
    assert.deepEqual( result.get, get,
        "Getter is copied by reference by default"
    );

    // check setter
    assert.deepEqual( result.set, set,
        "Setter is copied by reference by default"
    )
} )();


/**
 * For convenience
 */
( function testOperationReturnsDest()
{
    var dest = {};

    assert.deepEqual( copyTo( dest, {} ), dest,
        "Copy operation returns dest"
    );
} )();


/**
 * Just one of those tests you feel silly for making but is required
 */
( function testThrowsErrorIfSourceOrDestAreNotGiven()
{
    assert['throws']( function()
    {
        copyTo();
    }, TypeError, "Dest parameter is required" );

    assert['throws']( function()
    {
        copyTo( 'bla', {} );
    }, TypeError, "Dest parameter is required to be an object" );

    assert['throws']( function()
    {
        copyTo( {} );
    }, TypeError, "Src parameter is required" );

    assert['throws']( function()
    {
        copyTo( {}, 'foo' );
    }, TypeError, "Src parameter is required to be an object" );
} )();


/**
 * For convenience, let's support a deep copy as well, just in case they don't
 * want to copy everything by reference.
 */
( function testCanDeepCopy()
{
    var src  = { foo: [ 1, 2, 3 ] },
        dest = copyTo( {}, src, true );

    // copied values should be equal by value...
    assert.deepEqual( src.val, dest.val,
        "Copied values should be comparitively equal with deep copy"
    );

    // ...but not by reference
    assert.ok( src.foo !== dest.foo,
        "Copied values should not be the same object after deep copy"
    );
} )();


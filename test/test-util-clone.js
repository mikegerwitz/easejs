/**
 * Tests util.clone
 *
 *  Copyright (C) 2010 Mike Gerwitz
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
 * @package test
 */

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' );

var arr = [ 1, 2, 3 ],
    obj = { a: 1, b: 2 };

var arr2 = util.clone( arr ),
    obj2 = util.clone( obj );

assert.ok(
    ( arr !== arr2 ),
    "Cloned array is not the same object as the original"
);

assert.ok(
    ( obj !== obj2 ),
    "Cloned object is not the same object as the original"
);

// ensure array was properly cloned
for ( var i = 0, len = arr.length; i < len; i++ )
{
    assert.equal(
        arr2[ i ],
        arr[ i ],
        "Array data is properly cloned"
    );
}

// ensure object was properly cloned
for ( prop in obj )
{
    assert.equal(
        obj2[ prop ],
        obj[ prop ],
        "Object data is properly cloned"
    );
}


//
// deep clone
var deep_arr  = [ [ 1, 2 ], [ 3, 4 ], [ 5, [ 6, 7 ] ], { a: 1 } ],
    deep_arr2 = util.clone( deep_arr, true ),

    deep_i = 0;

// ensure that the cloned values still match
assert.deepEqual(
    deep_arr2,
    deep_arr,
    "Deep cloned values are equal"
);

deep_i = deep_arr.length;
while ( deep_i-- )
{
    assert.ok(
        ( deep_arr2[ i ] !== deep_arr[ i ] ),
        "Deep cloned array's values are cloned"
    );
}


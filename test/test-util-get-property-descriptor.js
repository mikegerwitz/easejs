/**
 * Tests util.getPropertyDescriptor
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
 */

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' ),

    get_set = !( util.definePropertyFallback() )
;


/**
 * If Object.getOwnPropertyDescriptor is provided by our environment, it should
 * be used by util
 */
( function testUtilGetOwnPropertyDescriptorIsObjectsIfAvailable()
{
    if ( get_set && Object.getOwnPropertyDescriptor )
    {
        assert.strictEqual(
            util.getOwnPropertyDescriptor,
            Object.getOwnPropertyDescriptor,
            "Util should use Object.getOwnPropertyDescriptor if available"
        );
    }
} )();


/**
 * The function should provide a boolean value indicating whether it can
 * traverse the prototype chain
 */
( function testIndicatesWhetherTraversalIsPossible()
{
    var traversable = ( {}.__proto__ ) ? true : false;

    assert.equal( util.getPropertyDescriptor.canTraverse, traversable,
        "Indicates whether traversal is possible"
    );
} )();


/**
 * We don't want tricksters to get funky with our system
 */
( function testTraversablePropertyIsNonWritable()
{
    var getDesc;

    if ( get_set )
    {
        assert.equal(
            Object.getOwnPropertyDescriptor(
                util.getPropertyDescriptor, 'canTraverse'
            ).writable,
            false,
            "Should not be able to alter canTravese value"
        );
    }
} )();


/**
 * The return value should mimic Object.getOwnPropertyDescriptor() if we're not
 * having to traverse the prototype chain
 */
( function testActsExactlyAsGetOwnPropertyDescriptorInEs5SystemsOnSameObject()
{
    var obj   = { foo: 'bar' },
        desc1 = util.getOwnPropertyDescriptor( obj, 'foo' ),
        desc2 = util.getPropertyDescriptor( obj, 'foo' )
    ;

    assert.deepEqual( desc1, desc2,
        "When operating one level deep, should return same as " +
            "Object.getOwnPropertyDescriptor"
    );
} )();


/**
 * If we *do* have to start traversing the prototype chain (which
 * Object.getOwnPropertyDescriptor() cannot do), then it should be as if we
 * called Object.getOwnPropertyDescriptor() on the object in the prototype chain
 * containing the requested property.
 */
( function testTraversesThePrototypeChain()
{
    // if we cannot traverse the prototype chain, this test is pointless
    if ( !util.getPropertyDescriptor.canTraverse )
    {
        return;
    }

    var proto = { foo: 'bar' },
        obj   = function() {}
    ;

    obj.prototype = proto;

    // to give ourselves the prototype chain (we don't want to set __proto__
    // because this test will also be run on pre-ES5 engines)
    var inst = new obj(),

        // get the actual descriptor
        expected = util.getOwnPropertyDescriptor( proto, 'foo' ),

        // attempt to gather the descriptor from the prototype chain
        given = util.getPropertyDescriptor( inst, 'foo' )
    ;

    assert.deepEqual( given, expected,
        "Properly traverses the prototype chain to retrieve the descriptor"
    );
} )();


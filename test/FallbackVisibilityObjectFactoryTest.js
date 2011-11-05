/**
 * Tests fallback visibility object factory
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

    // SUT
    FallbackVisibilityObjectFactory =
        common.require( 'FallbackVisibilityObjectFactory' ),

    // parent of SUT
    VisibilityObjectFactory = common.require( 'VisibilityObjectFactory' ),

    sut = FallbackVisibilityObjectFactory(),

    props = methods = {
        'public':    {},
        'protected': {},
        'private':   {},
    }
;


/**
 * To keep with the spirit of ease.js, we should be able to instantiate
 * VisibilityObjectFactory both with and without the 'new' keyword
 *
 * Consistency is key with these sorts of things.
 */
( function testCanInstantiateWithAndWithoutNewKeyword()
{
    // with 'new' keyword
    assert.ok(
        ( new FallbackVisibilityObjectFactory() )
            instanceof FallbackVisibilityObjectFactory,
        "Should be able to instantiate FallbackVisibilityObjectFactory with " +
            "'new' keyword"
    );

    // without 'new' keyword
    assert.ok(
        FallbackVisibilityObjectFactory()
            instanceof FallbackVisibilityObjectFactory,
        "Should be able to instantiate FallbackVisibilityObjectFactory " +
            "without 'new' keyword"
    );
} )();


/**
 * VisibilityObjectFactory should be part of our prototype chain.
 */
( function testInheritsFromVisibilityObjectFactory()
{
    // check an instance, rather than __proto__, because older engines do not
    // support it
    assert.ok(
        FallbackVisibilityObjectFactory() instanceof VisibilityObjectFactory,
        "Fallback should inherit from VisibilityObjectFactory"
    );
} )();


/**
 * We're falling back because we do not support the private visibility layer (or
 * any layers, for that matter). Ensure it's not created.
 */
( function testSetupMethodShouldNotAddPrivateLayer()
{
    var dest = {},
        obj  = sut.setup( dest, props, methods );

    assert.strictEqual( dest, obj,
        "Private visibility layer is not added atop destination"
    );
} )();


( function testCreatingPropertyProxyShouldSimplyReturnSelf()
{
    var base = {},
        dest = {};

    assert.strictEqual(
        sut.createPropProxy( base, dest, props ),
        base,
        "Creating property proxy should simply return original object"
    );
} )();


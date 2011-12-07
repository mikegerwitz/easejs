/**
 * Tests MethodWrapperFactory prototype
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

    Sut = common.require( 'MethodWrapperFactory' )
;


/**
 * To keep with the spirit of ease.js, we should be able to instantiate
 * MethodWrapperFactory both with and without the 'new' keyword
 *
 * Consistency is key with these sorts of things.
 */
( function testCanInstantiateWithAndWithoutNewKeyword()
{
    // with 'new' keyword
    assert.ok(
        ( new Sut() )
            instanceof Sut,
        "Should be able to instantiate MethodWrapperFactory with " +
            "'new' keyword"
    );

    // without 'new' keyword
    assert.ok( ( Sut() instanceof Sut ),
        "Should be able to instantiate MethodWrapperFactory " +
            "without 'new' keyword"
    );
} )();


/**
 * The factory itself is rather simple. The class should accept a factory
 * function which should return the wrapped method.
 */
( function testProvidedFactoryFunctionIsProperlyCalled()
{
    var called       = false,
        method       = function() {},
        super_method = function() {},
        cid          = 55,
        getInst      = function() {},
        retval       = 'foobar';

    var result = Sut(
        function( given_method, given_super, given_cid, givenGetInst )
        {
            called = true;

            assert.equal( given_method, method,
                "Factory method should be provided with method to wrap"
            );

            assert.equal( given_super, super_method,
                "Factory method should be provided with super method"
            );

            assert.equal( given_cid, cid,
                "Factory method should be provided with cid"
            );

            assert.equal( givenGetInst, getInst,
                "Factory method should be provided with proper inst function"
            );

            return retval;
        }
    ).wrapMethod( method, super_method, cid, getInst );

    // we'll include this in addition to the following assertion (which is
    // redundant) to make debugging more clear
    assert.equal( called, true,
        "Given factory method should be called"
    );

    assert.equal( result, retval,
        "Should return value from factory function"
    );
} )();


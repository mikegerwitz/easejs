/**
 * Tests method sut
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
    util   = common.require( 'util' )
    sut    = common.require( 'MethodWrappers' )
;


/**
 * If the method is called when bound to a different context (e.g. for
 * protected/private members), __super may not be properly bound.
 *
 * This test is in response to a bug found after implementing visibility
 * support. The __super() method was previously defined on 'this', which may or
 * may not be the context that is actually used. Likely, it's not.
 */
( function testSuperMethodWorksProperlyWhenContextDiffers()
{
    var super_called = false,
        retobj       = {},

        getInst = function()
        {
            return retobj;
        },

        // super method to be overridden
        method = sut.standard.wrapNew(
            function()
            {
                super_called = true;
            },
            null, 0, getInst
        )

        // the overriding method
        override = sut.standard.wrapOverride(
            function()
            {
                this.__super();
            },
            method, 0, getInst
        )
    ;

    // call the overriding method
    override();

    // ensure that the super method was called
    assert.equal( super_called, true,
        "__super() method is called even when context differs"
    );

    // finally, ensure that __super is no longer set on the returned object
    // after the call to ensure that the caller cannot break encapsulation by
    // stealing a method reference (sneaky, sneaky)
    assert.equal( retobj.__super, undefined,
        "__super() method is unset after being called"
    );
} )();


/**
 * Tests util.defineSecureProp
 *
 *  Copyright (C) 2010, 2011, 2013 Mike Gerwitz
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU General Public License as published by the Free Software
 *  Foundation, either version 3 of the License, or (at your option) any later
 *  version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 *  more details.
 *
 *  You should have received a copy of the GNU General Public License along with
 *  this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 */

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' );

var obj = {},
    val = 'bar';

var expected = ( ( Object.defineProperty instanceof Function ) ? false : true ),
    fallback = util.definePropertyFallback();

// IE 8 will fall back on first failure
if ( !expected && fallback )
{
    try
    {
        util.definePropertyFallback( false );
        util.defineSecureProp( {}, 'foo', 1 );

        // If the fallback was changed on us, then there was a problem (and this
        // is likely IE8). Change the value we're expecting so our tests don't
        // fail.
        if ( util.definePropertyFallback() === true )
        {
            expected = true;
        }
    }
    catch ( e ) {}
}

assert.equal(
    expected,
    fallback,
    "util.definePropertyFallback() returns whether defining a secure property is " +
        "unsupported"
);

assert.equal(
    util.definePropertyFallback( fallback ),
    util,
    "util.definePropertyFallback() returns self when used as a setter"
);

// perform secure property tests only if our parser supports it
if ( fallback === false )
{
    util.defineSecureProp( obj, 'foo', val );

    assert.equal(
        obj.foo,
        val,
        "Defining a secure prop creates a property with the correct value on " +
            "the given object"
    );

    // Our assertions below are going to use the data from the following method.
    // We're not going to test directly whether they're writable, etc, because
    // different engines may have different interpretations at this stage. (Or
    // it may not yet be implemented.) Therefore, we'll simply see if what we
    // requested has been set, and leave the problems up to the engine
    // developers.
    //
    // This is a case of ensuring we're testing our own functionality. We do not
    // want to test engine functionality.
    var desc = Object.getOwnPropertyDescriptor( obj, 'foo' );

    assert.equal(
        desc.writable,
        false,
        "Secure property is not writable"
    );

    assert.equal(
        desc.configurable,
        false,
        "Secure property is not configurable"
    );

    assert.equal(
        desc.enumerable,
        false,
        "Secure property is not enumerable"
    );
}


// be naughty so we can test the alternative implementation
util.definePropertyFallback( true );

var obj2 = {},
    val2 = 'baz';

// this should fall back on defining a normal property
util.defineSecureProp( obj2, 'foo', val2 );

assert.equal(
    obj2.foo,
    val2,
    "Secure property fallback still creates a property with the correct " +
        "value on the given object"
);

// if we have the ES5 functions available, ensure that the property was not
// defined securely
if ( fallback === false )
{
    var desc2 = Object.getOwnPropertyDescriptor( obj2, 'foo' );

    assert.equal(
        desc2.writable,
        true,
        "Secure property is writable when falling back"
    );

    assert.equal(
        desc2.configurable,
        true,
        "Secure property is configurable when falling back"
    );

    assert.equal(
        desc2.enumerable,
        true,
        "Secure property is enumerable when falling back"
    );
}

// restore in case the tests are not being run in separate processes
util.definePropertyFallback( fallback );


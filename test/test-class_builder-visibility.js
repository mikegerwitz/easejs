/**
 * Tests class builder visibility implementation
 *
 * See also: test-class-visibility.js
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

var common  = require( './common' ),
    assert  = require( 'assert' ),
    util    = common.require( 'util' ),
    builder = common.require( 'class_builder' )
;


/**
 * As discussed in GH#15, there's a bit of an issue when passing around 'this'
 * from within a method. For example, passing 'this' as an argument or invoking
 * a method with it as the context will effectively defeat encapsulation.
 * Unfortunately, there's really no way around that. Maybe a more elegant
 * solution will arise in the future. For now, not likely.
 *
 * We need to provide a means to reference the actual instance. __self is that
 * solution.
 */
( function testSelfPropertyReferencesInstanceRatherThanPropObj()
{
    var result = null
        ref    = null,

        foo = builder.build( {
            'public __construct': function()
            {
                // rather than returning, assign to external var so that we can
                // rest assured that the return value wasn't manipulated
                result = this.__self;
                ref    = this;
            }
        } )();

    assert.deepEqual( result, foo,
        "this.__self returns reference to actual instance"
    );

    // the property should be read-only
    if ( util.definePropertyFallback() === false )
    {
        assert.equal(
            Object.getOwnPropertyDescriptor( ref, '__self' ).writable,
            false,
            "this.__self is not writable"
        );
    }
} )();


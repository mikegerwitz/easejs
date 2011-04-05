/**
 * Tests static members (this includes constants)
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

var common    = require( './common' ),
    assert    = require( 'assert' ),
    builder   = common.require( 'class_builder' ),
    fallback  = common.require( 'util' ).definePropertyFallback()
;

/**
 * Static members, by their nature, should be accessible through the class
 * definition itself; that is, without instantiation. It should also not be
 * available through the generated prototype (and therefore, be unavailable to
 * instances).
 */
( function testPublicStaticMembersAreAccessibleViaClassDefinitionOnly()
{
    var val  = 'foo',
        val2 = 'bar',
        Foo  = builder.build(
        {
            'public static foo': val,

            // should be public by default
            'static bar': val2,

            // the same rules should apply to methods
            'public static baz': function()
            {
                return val;
            },

            'static foobar': function()
            {
                return val2;
            },
        } );

    // properties should be accessible via class definition
    assert.equal( Foo.foo, val,
        "Public static properties should be accessible via class definition"
    );

    // as long as the above test succeeded, we can then conclude that static
    // members are public by default if the following succeeds
    assert.equal( Foo.bar, val2,
        "Static properties are public by default"
    );

    // methods should be accessible via class definition
    assert.equal( Foo.baz(), val,
        "Public static methods should be accessible via class definition"
    );

    // same rules as above, but with a method
    assert.equal( Foo.foobar(), val2,
        "Static methods are public by default"
    );

    // neither should be a part of the prototype
    assert.equal( Foo.prototype.foo, undefined,
        "Public static properties are *not* part of the prototype"
    );
    assert.equal( Foo.prototype.baz, undefined,
        "Public static methods are *not* part of the prototype"
    );
} )();


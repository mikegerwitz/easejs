/**
 * Tests class module extend() method
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

require( './common' );

var assert = require( 'assert' ),
    Class  = require( 'class' );

var foo_props = {
        one: 1,
        two: 2,
    },
    Foo = Class.extend( foo_props );

assert.ok(
    ( Foo.extend instanceof Function ),
    "Created class contains extend method"
);

var sub_props = {
        three: 3,
        four:  4,
    },
    SubFoo = Foo.extend( sub_props );

assert.ok(
    ( SubFoo instanceof Object ),
    "Subtype is returned as an object"
);

// ensure properties were inherited from supertype
for ( var prop in foo_props )
{
    assert.equal(
        foo_props[ prop ],
        SubFoo.prototype[ prop ],
        "Subtype inherits parent properties: " + prop
    );
}

// and ensure that the subtype's properties were included
for ( var prop in sub_props )
{
    assert.equal(
        sub_props[ prop ],
        SubFoo.prototype[ prop ],
        "Subtype contains its own properties: " + prop
    );
}

assert.ok(
    ( new SubFoo() instanceof Foo ),
    "Subtypes must be considered to be instances of their supertypes"
);


//         Foo
//          |
//        SubFoo
//        /   \
// SubSubFoo  SubSubFoo2
//
var SubSubFoo  = SubFoo.extend(),
    SubSubFoo2 = SubFoo.extend();

assert.ok(
    ( new SubSubFoo() instanceof Foo ),
    "Sub-subtypes should be instances of their super-supertype"
);

assert.ok(
    !( new SubFoo() instanceof SubSubFoo ),
    "Supertypes should not be considered instances of their subtypes"
);

assert.ok(
    !( new SubSubFoo2() instanceof SubSubFoo ),
    "Subtypes should not be considered instances of their siblings"
);


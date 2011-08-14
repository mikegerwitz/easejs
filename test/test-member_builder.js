/**
 * Tests generic member builder
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
    builder = common.require( 'MemberBuilder' )()
;


( function testCanEmptyMemberObject()
{
    assert.deepEqual(
        builder.initMembers(),
        { 'public': {}, 'protected': {}, 'private': {} },
        "Can initialize empty (clean) member object with each level of " +
            " visibility"
    );
} )();


( function testCanInitMembersWithExistingObjects()
{
    var pub  = { foo: 'bar' },
        pro  = { bar: 'baz' },
        priv = { baz: 'foo' },

        members = builder.initMembers( pub, pro, priv )
    ;

    assert.deepEqual(
        members[ 'public' ],
        pub,
        "Can specify object to use for public members"
    );

    assert.deepEqual(
        members[ 'protected' ],
        pro,
        "Can specify object to use for protected members"
    );

    assert.deepEqual(
        members[ 'private' ],
        priv,
        "Can specify object to use for private members"
    );
} )();


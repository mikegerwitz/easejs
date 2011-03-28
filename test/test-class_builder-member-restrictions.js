/**
 * Tests class builder member restrictions
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
    builder = common.require( 'class_builder' )
;


/**
 * It's always useful to be able to quickly reference a list of reserved members
 * so that an implementer can programatically handle runtime cases. It's also
 * useful for testing.
 */
( function testCanRetrieveListOfReservedMembers()
{
    var reserved = builder.getReservedMembers();

    assert.ok( reserved instanceof Object,
        "Can retrieve hash of reserved members"
    );
} )();


/**
 * Ability to alter the reserved members list would permit implementors to break
 * compatibility with libraries that use the reserved members being added.
 * Furthermore, it could add unintended consequences if a reserved member were
 * removed from the list and used. To put it simply, it could cause complete and
 * utter chaos. As such, no. No, no, no.
 *
 * It is of course true that future versions of ease.js could add additional
 * reserved members, which is why one should never prefix their variables in the
 * same manner ease.js does for reserved members. But let's leave that to
 * ease.js, shall we?
 */
( function testCannotModifyInternalReservedMembersList()
{
    var val = 'foo';

    // attempt to add to list
    builder.getReservedMembers().foo = val;

    assert.notEqual(
        builder.getReservedMembers().foo,
        val,
        "Cannot alter internal list of reserved members"
    );
} )();


/**
 * Ensure that each of the reserved members will throw an exception if they are
 * used.
 */
( function testAllReservedMembersAreActuallyReserved()
{
    var reserved = builder.getReservedMembers(),
        count    = 0;

    // test each of the reserved members
    for ( name in reserved )
    {
        // properties
        assert.throws(
            function()
            {
                var obj = {};
                obj[ name ] = '';

                Class( obj );
            },
            Error,
            "Reserved members cannot be used in class definitions as " +
                "properties"
        );

        // methods
        assert.throws(
            function()
            {
                var obj = {};
                obj[ name ] = function() {};

                Class( obj );
            },
            Error,
            "Reserved members cannot be used in class definitions as " +
                "methods"
        );

        count++;
    }

    // ensure we weren't provided an empty object
    assert.notEqual( count, 0,
        "Reserved memebers were tested"
    );
} )();


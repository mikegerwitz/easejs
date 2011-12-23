/**
 * Tests class builder member restrictions
 *
 *  Copyright (C) 2010,2011 Mike Gerwitz
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

var common  = require( './common' ),
    assert  = require( 'assert' ),

    Class        = common.require( 'class' ),
    ClassBuilder = common.require( 'ClassBuilder' ),
    builder      = ClassBuilder(
        common.require( 'MemberBuilder' )(),
        common.require( 'VisibilityObjectFactoryFactory' ).fromEnvironment()
    )
;


/**
 * It's always useful to be able to quickly reference a list of reserved members
 * so that an implementer can programatically handle runtime cases. It's also
 * useful for testing.
 */
( function testCanRetrieveListOfReservedMembers()
{
    var reserved = ClassBuilder.getReservedMembers();

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
    ClassBuilder.getReservedMembers().foo = val;

    assert.notEqual(
        ClassBuilder.getReservedMembers().foo,
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
    var reserved = ClassBuilder.getReservedMembers(),
        count    = 0;

    // test each of the reserved members
    for ( var name in reserved )
    {
        // properties
        assert['throws'](
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
        assert['throws'](
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


/**
 * We want these available for the same reason that we want the restricted
 * members available (see above)
 */
( function testCanRetrieveListOfForcedPublicMethods()
{
    var pub   = ClassBuilder.getForcedPublicMethods(),
        count = 0;

    assert.ok( pub instanceof Object,
        "Can retrieve hash of forced-public methods"
    );

    for ( var name in pub )
    {
        count++;
    }

    // ensure we weren't provided an empty object
    assert.notEqual( count, 0,
        "Forced-public method list is not empty"
    );
} )();


/**
 * See above. Same reason that we don't want reserved members to be modified.
 */
( function testCannotModifyInternalForcedPublicMethodsList()
{
    var val = 'foo';

    // attempt to add to list
    ClassBuilder.getForcedPublicMethods().foo = val;

    assert.notEqual(
        ClassBuilder.getForcedPublicMethods().foo,
        val,
        "Cannot alter internal list of forced-public methods"
    );
} )();


/**
 * Ensure that an exception will be thrown for each forced-public method that is
 * not declared as public in the class definition.
 */
( function testAllForcedPublicMethodsAreForcedToPublic()
{
    var pub = ClassBuilder.getForcedPublicMethods();

    // test each of the reserved members
    for ( var name in pub )
    {
        assert['throws']( function()
        {
            var obj = {};
            obj[ 'private ' + name ] = function() {};

            Class( obj );
        }, Error, "Forced-public methods must be declared as public" );
    }
} )();


/**
 * Tests class builder member restrictions
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        // XXX: the Sut is not directly tested; get rid of these!
        this.Class         = this.require( 'class' );
        this.AbstractClass = this.require( 'class_abstract' );

        this.Sut = this.require( 'ClassBuilder' );

        // weak flag test data
        this.weak = [
            [ 'weak foo', 'foo' ],       // former weak
            [ 'foo', 'weak foo' ],       // latter weak
            [ 'weak foo', 'weak foo' ],  // both weak
        ];
    },


    /**
     * It's always useful to be able to quickly reference a list of reserved
     * members so that an implementer can programatically handle runtime
     * cases. It's also useful for testing.
     */
    'Can retrieve a list of reserved members': function()
    {
        var reserved = this.Sut.getReservedMembers();

        this.assertOk( reserved instanceof Object,
            "Can retrieve hash of reserved members"
        );
    },


    /**
     * Ability to alter the reserved members list would permit implementors
     * to break compatibility with libraries that use the reserved members
     * being added.  Furthermore, it could add unintended consequences if a
     * reserved member were removed from the list and used. To put it
     * simply, it could cause complete and utter chaos. As such, no. No, no,
     * no.
     *
     * It is of course true that future versions of ease.js could add
     * additional reserved members, which is why one should never prefix
     * their variables in the same manner ease.js does for reserved members.
     * But let's leave that to ease.js, shall we?
     */
    'Cannot modify internal reserved members list': function()
    {
        var val = 'foo';

        // attempt to add to list
        this.Sut.getReservedMembers().foo = val;

        this.assertNotEqual(
            this.Sut.getReservedMembers().foo,
            val,
            "Cannot alter internal list of reserved members"
        );
    },


    /**
     * This test is to ensure that nobody (a) removes reserved members
     * without understanding the consequences or (b) adds reserved members
     * without properly documenting them.
     */
    'Proper members are reserved': function()
    {
        var chk      = [ '__initProps', 'constructor' ],
            i        = chk.length,
            reserved = this.Sut.getReservedMembers();

        while ( i-- )
        {
            var cur = chk[ i ];

            this.assertOk( reserved.hasOwnProperty( cur ),
                "Member '" + cur + "' should be reserved"
            );

            delete reserved[ cur ];
        }

        // ensure there are no others that we didn't expect
        for ( var name in reserved )
        {
            this.assertFail( "Untested reserved member found: " + name );
        }
    },


    /**
     * Ensure that each of the reserved members will throw an exception if
     * they are used.
     */
    'All reserved members are actually reserved': function()
    {
        var _self    = this,
            reserved = this.Sut.getReservedMembers(),
            count    = 0;

        // test each of the reserved members
        for ( var name in reserved )
        {
            // properties
            this.assertThrows(
                function()
                {
                    var obj = {};
                    obj[ name ] = '';

                    _self.Class( obj );
                },
                Error,
                "Reserved members cannot be used in class definitions as " +
                    "properties"
            );

            // methods
            this.assertThrows(
                function()
                {
                    var obj = {};
                    obj[ name ] = function() {};

                    _self.Class( obj );
                },
                Error,
                "Reserved members cannot be used in class definitions as " +
                    "methods"
            );

            count++;
        }

        // ensure we weren't provided an empty object
        this.assertNotEqual( count, 0,
            "Reserved memebers were tested"
        );
    },


    /**
     * We want these available for the same reason that we want the
     * restricted members available (see above)
     */
    'Can retrieve list of forced public methods': function()
    {
        var pub   = this.Sut.getForcedPublicMethods(),
            count = 0;

        this.assertOk( pub instanceof Object,
            "Can retrieve hash of forced-public methods"
        );

        for ( var name in pub )
        {
            count++;
        }

        // ensure we weren't provided an empty object
        this.assertNotEqual( count, 0,
            "Forced-public method list is not empty"
        );
    },


    /**
     * See above. Same reason that we don't want reserved members to be
     * modified.
     */
    'Cannot modify internal forced public methods list': function()
    {
        var val = 'foo';

        // attempt to add to list
        this.Sut.getForcedPublicMethods().foo = val;

        this.assertNotEqual(
            this.Sut.getForcedPublicMethods().foo,
            val,
            "Cannot alter internal list of forced-public methods"
        );
    },


    /**
     * Ensure that an exception will be thrown for each forced-public method
     * that is not declared as public in the class definition.
     */
    'All forced public methods are forced to public': function()
    {
        var _self = this,
            pub   = this.Sut.getForcedPublicMethods();

        // test each of the reserved members
        for ( var name in pub )
        {
            this.assertThrows( function()
            {
                var obj = {};
                obj[ 'private ' + name ] = function() {};

                _self.Class( obj );
            }, Error, "Forced-public methods must be declared as public" );
        }
    },


    /**
     * If different keywords are used, then a definition object could
     * contain two members of the same name. This is probably a bug in the
     * user's implementation, so we should flip our shit.
     *
     * But, see the next test.
     */
    'Cannot define two members of the same name': function()
    {
        var _self = this;
        this.assertThrows( function()
        {
            // duplicate foos
            _self.Class(
            {
                'public foo':    function() {},
                'protected foo': function() {},
            } );
        } );
    },


    /**
     * Code generation tools may find it convenient to declare a duplicate
     * member without knowing whether or not a duplicate will exist; this
     * may save time and complexity when ease.js has been designed to handle
     * certain situations. If at least one of the conflicting members has
     * been flagged as `weak', then we should ignore the error.
     *
     * As an example, this is used interally with ease.js to inherit
     * abstract members from traits while still permitting concrete
     * definitions.
     */
    '@each(weak) Can define members of the same name if one is weak':
    function( weak )
    {
        // TODO: this makes assumptions about how the code works; the code
        // needs to be refactored to permit more sane testing (since right
        // now it'd be a clusterfuck)
        var dfn = {};
        dfn[ 'abstract ' + weak[ 0 ] ] = [];
        dfn[ 'abstract ' + weak[ 1 ] ] = [];

        var _self = this;
        this.assertDoesNotThrow( function()
        {
            _self.AbstractClass( dfn );
        } );
    },


    /**
     * During the course of processing, certain data are accumulated into
     * the member builder state; this state must be post-processed to
     * complete anything that may be pending.
     */
    'Member builder state is ended after processing': function()
    {
        var _self = this,
            build = this.require( 'MemberBuilder' )();

        var sut = this.Sut(
            this.require( 'warn' ).DismissiveHandler(),
            build,
            this.require( 'VisibilityObjectFactoryFactory' )
                .fromEnvironment()
        );

        // TODO: test that we're passed the right state
        var called = false;
        build.end = function( state )
        {
            called = true;
        };

        sut.build( {} );
        this.assertOk( called );
    },
} );

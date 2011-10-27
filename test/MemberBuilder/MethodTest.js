/**
 * Tests method builder
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

require( 'common' ).testCase(
{
    setUp: function()
    {
        // stub factories used for testing
        var stubFactory = this.require( 'MethodWrapperFactory' )(
             function( func ) { return func; }
        );

        this.sut = this.require( 'MemberBuilder' )(
            stubFactory, stubFactory
        );

        this.members = this.sut.initMembers();
    },


    /**
     * Unlike languages like C++, ease.js does not automatically mark overridden
     * methods as virtual. C# and some other languages offer a 'seal' keyword or
     * similar in order to make overridden methods non-virtual. In that sense,
     * ease.js will "seal" overrides by default.
     */
    'Overridden methods are not virtual by default': function()
    {
        var name = 'foo';

        // declare a virtual method
        this.sut.buildMethod( this.members, {}, name, function() {},
            { virtual: true }, function() {}, 1, {}
        );

        // override it (non-virtual)
        this.sut.buildMethod( this.members, {}, name, function() {},
            { override: true }, function() {}, 1, {}
        );

        // attempt to override again (should fail)
        try
        {
            this.sut.buildMethod( this.members, {}, name, function() {},
                { override: true }, function() {}, 1, {}
            );
        }
        catch ( e )
        {
            this.incAssertCount();
            return;
        }

        assert.fail( "Overrides should not be declared as virtual by default" );
    },
} );

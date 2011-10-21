/**
 * Tests visibility portion of member builder
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
    caseSetUp: function()
    {
        this.buildStubMethod = function( name, val, visibility )
        {
            var keywords = {};

            // set visibility level using access modifier
            keywords[ visibility ] = true;

            this.sut.buildMethod( this.members, {}, name,
                function() {
                    return val;
                },
                keywords,
                function() {},
                1,
                {}
            );
        };


        this.buildStubProp = function( name, val, visibility )
        {
            var keywords = {};

            // set visibility level using access modifier
            keywords[ visibility ] = true;

            this.sut.buildProp( this.members, {}, name, val, keywords, {} );
        };


        this.assertOnlyIn = function( vis, name )
        {
            var found = false;

            this.incAssertCount();

            for ( level in this.members )
            {
                if ( typeof this.members[ level ][ name ] === 'undefined' )
                {
                    continue;
                }

                // we found it; ensure it's in the expected visibility level
                found = true;
                if ( level !== vis )
                {
                    this.fail( name + " should only be accessible in: " + vis );
                }
            }

            found || this.fail(
                "Did not find '" + name + "' in level: " + vis
            );
        };


        this.basicVisPropTest = function( vis )
        {
            var name = vis + 'name',
                val  = vis + 'val';

            this.buildStubProp( name, val, vis );
            this.assertEqual( this.members[ vis ][ name ][ 0 ], val );

            this.assertOnlyIn( vis, name, this.members );
        };


        this.basicVisMethodTest = function( vis )
        {
            var name = vis + 'name',
                val  = vis + 'val';

            this.buildStubMethod( name, val, vis );

            this.assertEqual(
                this.members[ vis ][ name ](),
                val
            );

            this.assertOnlyIn( vis, name, this.members );
        };
    },


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


    'Properties are only accessible via their respective interfaces': function()
    {
        var _self = this,
            tests = [ 'public', 'protected', 'private' ];

        for ( i in tests )
        {
            _self.basicVisPropTest( tests[ i ] );
        };
    },


    'Methods are only accessible via their respective interfaces': function()
    {
        var _self = this;
            tests = [ 'public', 'protected', 'private' ];

        for ( i in tests )
        {
            _self.basicVisMethodTest( tests[ i ] );
        };
    },
} );

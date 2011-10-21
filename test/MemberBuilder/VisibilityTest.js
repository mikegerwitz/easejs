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

function buildStubMethod( name, val, visibility )
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
}


function buildStubProp( name, val, visibility )
{
    var keywords = {};

    // set visibility level using access modifier
    keywords[ visibility ] = true;

    this.sut.buildProp( this.members, {}, name, val, keywords, {} );
}


require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.buildStubMethod = function()
        {
            buildStubMethod.apply( this, arguments );
        };

        this.buildStubProp = function()
        {
            buildStubProp.apply( this, arguments );
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


    'Public properties are accessible via the public interface': function()
    {
        var name = 'pub',
            val  = 'val';

        this.buildStubProp( name, val, 'public' );
        this.assertEqual( this.members[ 'public' ][ name ][ 0 ], val );
    },


    'Public methods are accessible via the public interface': function()
    {
        var name = 'pub',
            val  = 'val';

        this.buildStubMethod( name, val, 'public' );

        this.assertEqual(
            this.members[ 'public' ][ name ](),
            val
        );
    },
} );

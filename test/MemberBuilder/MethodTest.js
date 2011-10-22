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

var common    = require( 'common' ),
    assert    = require( 'assert' ),
    mb_common = require( __dirname + '/../inc-member_builder-common' ),
    util      = common.require( 'util' ),

    // stub factories used for testing
    stubFactory = common.require( '/MethodWrapperFactory' )(
         function( func ) { return func; }
    ),

    builder = common.require( '/MemberBuilder' )( stubFactory, stubFactory )
;

mb_common.funcVal     = 'foobar';
mb_common.value       = function() { return mb_common.funcVal; };

// must wrap to call in proper context
var builder_method = mb_common.buildMember = function()
{
    builder.buildMethod.apply( builder, arguments );
}

// do assertions common to all member builders
mb_common.assertCommon();


/**
 * Unlike languages like C++, ease.js does not automatically mark overridden
 * methods as virtual. C# and some other languages offer a 'seal' keyword or
 * similar in order to make overridden methods non-virtual. In that sense,
 * ease.js will "seal" overrides by default.
 */
( function testOverriddenMethodsAreNotVirtualByDefault()
{
    // build a virtual method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    // override it (non-virtual)
    mb_common.buildMemberQuick( { 'override': true }, true );

    // attempt to override again (should fail)
    try
    {
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        return;
    }

    assert.fail( "Overrides should not be declared as virtual by default" );
} )();


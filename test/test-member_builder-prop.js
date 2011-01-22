/**
 * Tests property builder
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
    mb_common = require( './inc-member_builder-common' )
;

mb_common.value       = { bar: 'baz' };
mb_common.buildMember = common.require( 'member_builder' ).buildProp;

// do assertions common to all member builders
mb_common.assertCommon();


( function testCannotOverrideMethodWithProperty()
{
    // this will be considered a method, as it is a function
    mb_common.value = function() {};
    mb_common.buildMemberQuick();

    assert.throws( function()
    {
        // attempt to override with property
        mb_common.value = 'foo';
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Cannot override method with property" );
} )();


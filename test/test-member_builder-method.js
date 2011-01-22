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

var common    = require( './common' ),
    assert    = require( 'assert' ),
    mb_common = require( './inc-member_builder-common' )
;

mb_common.value       = function() {};
mb_common.buildMember = common.require( 'member_builder' ).buildMethod;

// do assertions common to all member builders
mb_common.assertCommon();


/**
 * One may question the purpose of this assertion. Why should we not permit
 * overriding properties with methods? It's useful to be able to store callbacks
 * and such within properties.
 *
 * Yes, it is. However, that would be misinterpreting the purpose of the method
 * builder. Here, we are working with prototypes, not class instances. If the
 * user wishes to assign a function to the property (so long as it's permitted
 * by the type definition) after the class is instantiated, he/she may go right
 * ahead. However, if we modify the prototype to use a function, then the
 * prototype will interpret the function as a method. As such, the method cannot
 * be overridden with a property in the future. To avoid this confusing
 * scenario, we'll prevent it from occurring entirely.
 */
( function testCannotOverridePropertyWithMethod()
{
    mb_common.value = 'moofoo';
    mb_common.buildMemberQuick();

    assert.throws( function()
    {
        // attempt to override with function
        mb_common.value = function() {};
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Cannot override property with method" );
} )();


/**
 * To ensure interfaces of subtypes remain compatible with that of their
 * supertypes, the parameter lists must match and build upon each other.
 */
( function testMethodOverridesMustHaveEqualOrGreaterParameters()
{
    mb_common.value = function( one, two ) {};
    mb_common.buildMemberQuick();

    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Method can have equal number of parameters" );

    assert.doesNotThrow( function()
    {
        mb_common.value = function( one, two, three ) {};
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Method can have greater number of parameters" );

    assert.throws( function()
    {
        mb_common.value = function( one ) {};
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Method cannot have lesser number of parameters" );
} )();


/**
 * The __super property is defined for method overrides and permits invoking the
 * overridden method (method of the supertype).
 *
 * In this test, we are not looking to assert that __super matches the super
 * method. Rather, we want to ensure it /invokes/ it. This is because the super
 * method may be wrapped to provide additional functionality. We don't know, we
 * don't care. We just want to make sure it's functioning properly.
 */
( function testOverridenMethodShouldContainReferenceToSuperMethod()
{
    var orig_called = false;

    // "super" method
    mb_common.value = function()
    {
        orig_called = true;
    };

    mb_common.buildMemberQuick();

    // override method
    mb_common.value = function()
    {
        assert.notEqual(
            this.__super,
            undefined,
            "__super is defined for overridden method"
        );

        this.__super();
        assert.equal(
            orig_called,
            true,
            "Invoking __super calls super method"
        );
    };

    mb_common.buildMemberQuick( {}, true );

    // invoke the method
    mb_common.members[ 'public' ][ mb_common.name ]();
} )();


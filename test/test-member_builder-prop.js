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
    mb_common = require( __dirname + '/inc-member_builder-common' ),
    util      = common.require( 'util' ),

    // XXX: get rid of this disgusting mess; we're mid-refactor and all these
    // dependencies should not be necessary for testing
    MethodWrapperFactory = common.require( '/MethodWrapperFactory' ),
    wrappers             = common.require( '/MethodWrappers' ).standard,

    builder = common.require( '/MemberBuilder' )(
        MethodWrapperFactory( wrappers.wrapNew ),
        MethodWrapperFactory( wrappers.wrapOverride )
    )
;


mb_common.funcVal     = null;
mb_common.value       = { baj: 'baz' };
mb_common.buildMember = builder.buildProp

// must wrap to call in proper context
var builder_method = function()
{
    builder.buildMethod.apply( builder, arguments );
}

// do assertions common to all member builders
mb_common.assertCommon();


( function testCannotOverrideMethodWithProperty()
{
    // add a method
    mb_common.buildMember = builder_method;
    mb_common.value       = function() {};
    mb_common.buildMemberQuick();

    assert.throws( function()
    {
        // reset
        mb_common.buildMember = builder.buildProp;

        // attempt to override with property
        mb_common.value = 'foo';
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Cannot override method with property" );
} )();


/**
 * Abstract properties do not make sense. Simple as that.
 */
( function testCannotDeclareAbstractProperty()
{
    assert.throws( function()
    {
        mb_common.buildMemberQuick( { 'abstract': true } );
    }, TypeError, "Cannot declare abstract property" );
} )();


/**
 * Properties, unlike methods, are virtual by default. If a property's value can
 * be reassigned, why would a subclass not be able to reassign it? If one wishes
 * to prevent a property's value from changing, they should use the visibility
 * modifiers or declare the property as a constant.
 */
( function testCannotDeclareVirtualProperty()
{
    try
    {
        mb_common.buildMemberQuick( { 'virtual': true } );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( mb_common.name ) !== -1,
            "Virtual property error message should contain property name"
        );

        return;
    }

    assert.fail( "Should not be permitted to declare virtual properties" );
} )();


/*
 * While getters act as properties, it doesn't make sense to override
 * getters/setters with properties because they are fundamentally different.
 */
( function testCannotOverrideGetters()
{
    if ( util.definePropertyFallback() )
    {
        return;
    }

    mb_common.members[ 'public' ] = {};
    Object.defineProperty( mb_common.members[ 'public' ], mb_common.name, {
        get: function() {},
    } );

    try
    {
        mb_common.value = 'foo';
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( mb_common.name ) !== -1,
            "Property override getter failure should contain property name"
        );

        // ensure we have the correct error
        assert.ok( e.message.search( 'getter' ) !== -1,
            "Proper error is thrown for getter override failure"
        );

        return;
    }

    assert.fail(
        "Should not be permitted to override getters with properties"
    );
} )();


/**
 * While setters act as properties, it doesn't make sense to override
 * getters/setters with properties because they are fundamentally different.
 */
( function testCannotOverrideSetters()
{
    if ( util.definePropertyFallback() )
    {
        return;
    }

    mb_common.members[ 'public' ] = {};
    Object.defineProperty( mb_common.members[ 'public' ], mb_common.name, {
        set: function() {},
    } );

    try
    {
        mb_common.value = 'foo';
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( mb_common.name ) !== -1,
            "Property override setter failure should contain method name"
        );

        // ensure we have the correct error
        assert.ok( e.message.search( 'setter' ) !== -1,
            "Proper error is thrown for setter override failure"
        );

        return;
    }

    assert.fail(
        "Should not be permitted to override setters with properties"
    );
} )();


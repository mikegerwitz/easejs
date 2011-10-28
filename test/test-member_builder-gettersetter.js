/**
 * Tests getter/setter builder
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

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' ),

    builder = common.require( 'MemberBuilder' )(),

    buildGetter = builder.buildGetter,
    buildSetter = builder.buildSetter,

    // member visibility types are quoted because they are reserved keywords
    members = {},
    meta    = {},

    // stub values
    name  = 'foo',
    value = function() {}
;


// no need to test getters/setters in browsers that do not support them
if ( util.definePropertyFallback() )
{
    return;
}


function setUp()
{
    // clear out the members for a fresh start
    members  = { 'public': {}, 'protected': {}, 'private': {} };
}


/**
 * Partially applied function to quickly build getter from common test data
 */
function buildGetterSetterQuick( keywords, val, preserve_prior, use )
{
    preserve_prior = !!preserve_prior;
    use            = ( use === undefined ) ? 0 : +use;

    keywords = keywords || {};
    val      = val || value;

    if ( !preserve_prior )
    {
        setUp();
    }

    if ( use == 0 || use == 1 )
    {
        buildGetter( members, meta, name, val, keywords );
    }
    if ( use == 0 || use == 2 )
    {
        buildSetter( members, meta, name, val, keywords );
    }
}


function testEach( test )
{
    test( 'getter', function( keywords, val, preserve )
    {
        buildGetterSetterQuick.call( this, keywords, val, preserve, 1 );
    } );

    test( 'setter', function( keywords, val, preserve )
    {
        buildGetterSetterQuick.call( this, keywords, val, preserve, 2 );
    } );
}


( function testThrowsTypeErrorIfMultipleVisibilityKeywordsAreGiven()
{
    assert.throws( function()
    {
        buildGetterSetterQuick( {
            'public':    true,
            'protected': true,
        } );
    }, TypeError, "Cannot specify multiple visibility keywords (0)" );

    assert.throws( function()
    {
        buildGetterSetterQuick( {
            'public':  true,
            'private': true,
        } );
    }, TypeError, "Cannot specify multiple visibility keywords (1)" );

    assert.throws( function()
    {
        buildGetterSetterQuick( {
            'protected': true,
            'private':   true,
        } );
    }, TypeError, "Cannot specify multiple visibility keywords (2)" );

} )();


/**
 * Getters/setters should not be able to override methods, for the obvious
 * reason that they are two different types and operate entirely differently. Go
 * figure.
 */
testEach( function testCannotOverrideMethodWithGetterOrSetter( type, build )
{
    setUp();

    // method
    members[ 'public' ][ name ] = function() {};

    try
    {
        // attempt to override method with getter/setter (should fail)
        build( { 'public': true }, null, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( name ) !== -1,
            "Method override error message should contain getter/setter name"
        );
        return;
    }

    assert.fail( type + " should not be able to override methods");
} );


/**
 * Getters/setters should not be able to override properties. While, at first,
 * this concept may seem odd, keep in mind that the parent would likely not
 * expect a subtype to be able to override property assignments. This could open
 * up holes to exploit the parent class.
 */
testEach( function testCannotOverridePropertiesWithGetterOrSetter( type, build )
{
    setUp();

    // declare a property
    members[ 'public' ][ name ] = 'foo';

    try
    {
        // attempt to override property with getter/setter (should fail)
        build( { 'public': true }, null, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( name ) !== -1,
            "Property override error message should contain getter/setter name"
        );
        return;
    }

    assert.fail( type + " should not be able to override properties" );
} );


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

var common    = require( './common' ),
    assert    = require( 'assert' ),

    buildGetter = common.require( 'member_builder' ).buildGetter,
    buildSetter = common.require( 'member_builder' ).buildSetter,

    // member visibility types are quoted because they are reserved keywords
    members = {},
    meta    = {},

    // stub values
    name  = 'foo',
    value = function() {}
;


function setUp()
{
    // clear out the members for a fresh start
    members  = { 'public': {}, 'protected': {}, 'private': {} };
}


/**
 * Partially applied function to quickly build getter from common test data
 */
function buildGetterSetterQuick( keywords, val )
{
    keywords = keywords || {};
    val      = val || value;

    setUp();

    buildGetter( members, meta, name, val, keywords );
    buildSetter( members, meta, name, val, keywords );
}


/**
 * Asserts that the given property exists only in the prototype for the
 * requested visibility
 */
function assertOnlyVisibility( vis, name, value, message )
{
    var check = [ 'public', 'protected', 'private' ],
        i     = check.length,
        visi  = '',
        cmp;

    // forEach not used for pre-ES5 browser support
    while ( i-- )
    {
        visi = check[ i ];
        cmp  = ( visi === vis ) ? value : undefined;

        assert.deepEqual(
            members[ visi ].__lookupGetter__( name ),
            cmp,
            ( message + " (0)" )
        );

        assert.deepEqual(
            members[ visi ].__lookupSetter__( name ),
            cmp,
            ( message + " (1)" )
        );
    }
}


( function testRecognizesPublicProperty()
{
    buildGetterSetterQuick( { 'public': true } );

    assertOnlyVisibility( 'public',
        name,
        value,
        "Public properties are copied only to the public member prototype"
    );
} )();


( function testRecognizesProtectedProperty()
{
    buildGetterSetterQuick( { 'protected': true } );

    assertOnlyVisibility( 'protected',
        name,
        value,
        "Protected properties are copied only to the protected member prototype"
    );
} )();


( function testRecognizesPrivateProperty()
{
    buildGetterSetterQuick( { 'private': true } );

    assertOnlyVisibility( 'private',
        name,
        value,
        "Private properties are copied only to the private member prototype"
    );
} )();


( function testCopiedIntoPublicPrototypeByDefault()
{
    buildGetterSetterQuick();

    assertOnlyVisibility( 'public',
        name,
        value,
        "Properties are copied only to the public member prototype by default"
    );
} )();


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


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
    buildProp = common.require( 'member_builder' ).buildProp

    // member visibility types are quoted because they are reserved keywords
    members = {},
    meta    = {},

    // stub values
    name  = 'foo',
    value = { bar: 'baz' }
;


/**
 * Partially applied function to quickly build properties using common test data
 */
function buildPropQuick( keywords )
{
    keywords = keywords || {};

    // clear out the members for a fresh start
    members  = { 'public': {}, 'protected': {}, 'private': {} };

    return buildProp( members, meta, name, value, keywords );
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
            members[ visi ][ name ],
            cmp,
            message
        );
    }
}


( function testRecognizesPublicProperty()
{
    buildPropQuick( { 'public': true } );

    assertOnlyVisibility( 'public',
        name,
        value,
        "Public properties are copied only to the public member prototype"
    );
} )();


( function testRecognizesProtectedProperty()
{
    buildPropQuick( { 'protected': true } );

    assertOnlyVisibility( 'protected',
        name,
        value,
        "Protected properties are copied only to the protected member prototype"
    );
} )();


( function testRecognizesPrivateProperty()
{
    buildPropQuick( { 'private': true } );

    assertOnlyVisibility( 'private',
        name,
        value,
        "Private properties are copied only to the private member prototype"
    );
} )();


( function testCopiedIntoPublicPrototypeByDefault()
{
    buildPropQuick();

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
        buildPropQuick( {
            'public':    true,
            'protected': true,
        } );
    }, TypeError, "Cannot specify multiple visibility keywords (0)" );

    assert.throws( function()
    {
        buildPropQuick( {
            'public':  true,
            'private': true,
        } );
    }, TypeError, "Cannot specify multiple visibility keywords (1)" );

    assert.throws( function()
    {
        buildPropQuick( {
            'protected': true,
            'private':   true,
        } );
    }, TypeError, "Cannot specify multiple visibility keywords (2)" );
} )();


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
    members = { 'public': {}, 'protected': {}, 'private': {} },
    meta    = {},

    // stub values
    name  = 'foo',
    value = 'bar'
;


/**
 * Partially applied function to quickly build properties using common test data
 */
function buildPropQuick( keywords )
{
    return buildProp( members, meta, name, value, keywords );
}


( function testRecognizesPublicProperty()
{
    var keywords = { 'public': true },
        result   = buildPropQuick( keywords )
    ;

    assert.equal(
        members[ 'public' ][ name ],
        value,
        "Public properties are copied to the public member prototype"
    );
} )();


( function testRecognizesProtectedProperty()
{
    var keywords = { 'protected': true },
        result   = buildPropQuick( keywords )
    ;

    assert.equal(
        members[ 'protected' ][ name ],
        value,
        "Protected properties are copied to the protected member prototype"
    );
} )();


( function testRecognizesPrivateProperty()
{
    var keywords = { 'private': true },
        result   = buildPropQuick( keywords )
    ;

    assert.equal(
        members[ 'private' ][ name ],
        value,
        "Private properties are copied to the private member prototype"
    );
} )();


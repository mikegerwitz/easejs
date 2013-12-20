/**
 * Tests property keyword parser
 *
 *  Copyright (C) 2010, 2011 Mike Gerwitz
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
 */

var common = require( './common' ),
    assert = require( 'assert' ),
    parse  = common.require( 'prop_parser' ).parseKeywords,

    data     = parse( 'virtual static abstract foo' ),
    keywords = data.keywords
;


( function testProperlyRetrievesName()
{
    assert.equal(
        data.name,
        'foo',
        "Property keyword parser properly retrieves name"
    );
} )();


( function testProperlyRetrievesAllKeywords()
{
    assert.ok(
        ( ( keywords['virtual'] === true )
            && ( keywords['static'] === true )
            && ( keywords['abstract'] === true )
        ),
        "Property keyword parser properly retrieves all keywords"
    );
} )();


/**
 * In an effort to prevent unnecessary bugs, notify the user when they use a
 * keyword that is not recognized.
 */
( function testOnlyPermitsKnownKeywords()
{
    assert.doesNotThrow( function()
    {
        // Odd seeing these all together, isn't it? Note that this is not at all
        // valid, but the prop parser doesn't care what appears together.
        parse( 'public protected private static virtual abstract const var' );
    }, Error, "Known keywords are permitted by the parser" );

    var oddword = 'foobunny',
        oddname = 'moobunny';

    try
    {
        // remember, the last part of the string is the var name and is not
        // considered to be a keyword
        parse( oddword + ' ' + oddname );
    }
    catch ( e )
    {
        assert.ok( e.message.search( oddword ) !== -1,
            "Error message contains unrecognized keyword"
        );

        assert.ok( e.message.search( oddname ) !== -1,
            "Error message contains name"
        );

        return;
    }

    assert.fail( "Should not permit unknown keywords" );
} )();


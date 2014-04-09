/**
 * Tests property keyword parser
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut = this.require( 'prop_parser' );
    },


    setUp: function()
    {
        // pre-parsed test data
        this.ptest = this.Sut.parseKeywords(
            'virtual static abstract foo'
        );
    },


    /**
     * The intended name of the field is the last word in the string;
     * everything else is a keyword.
     */
    'Retrieves field name void of keywords': function()
    {
        this.assertEqual( this.ptest.name, 'foo' );
    },


    /**
     * Complements above test.
     */
    'Retrieves all keywords': function()
    {
        var keywords = this.ptest.keywords;

        // reserved words are quoted for environments that do not follow
        // ECMAScript's requirement of treating anything after a `.' as a
        // field
        this.assertOk( keywords['virtual'] );
        this.assertOk( keywords['static'] );
        this.assertOk( keywords['abstract'] );
    },


    /**
     * This is more of a sanity check than anything---it really should never
     * happen unless someone has been drinking heavily.
     */
    'Does not include keywords not explicitly provided': function()
    {
        var keywords = this.ptest.keywords;

        delete keywords['virtual'];
        delete keywords['static'];
        delete keywords['abstract'];

        // there should be no other keywords
        for ( var k in keywords )
        {
            this.assertFail( "Someone has been drinking: " + k );
        }

        // if we've gotten to this point, then we're good
        this.assertOk( true );
    },


    /**
     * Sounds like a good April Fool's joke.
     */
    'Accepts all valid keywords': function()
    {
        var parse = this.Sut.parseKeywords;

        this.assertDoesNotThrow( function()
        {
            // Odd seeing these all together, isn't it? Note that this is
            // not at all valid, but the prop parser doesn't care what
            // appears together.
            parse(
                'public protected private ' +
                'virtual abstract override ' +
                'static const proxy weak ' +
                'var'
            );
        }, Error );
    },


    /**
     * In an effort to prevent unnecessary bugs, notify the user when they
     * use a keyword that is not recognized; this may be a typo,
     * misunderstanding of the API, or differences between versions of
     * ease.js.
     */
    'Does not accept unknown keywords': function()
    {
        var parse = this.Sut.parseKeywords;

        var oddword = 'foobunny',
            oddname = 'moobunny';

        try
        {
            // remember, the last part of the string is the var name and is
            // not considered to be a keyword
            parse( oddword + ' ' + oddname );
        }
        catch ( e )
        {
            this.assertOk( e.message.search( oddword ) !== -1,
                "Error message contains unrecognized keyword"
            );

            this.assertOk( e.message.search( oddname ) !== -1,
                "Error message contains name"
            );

            return;
        }

        this.assertFail( "Should not permit unknown keywords" );
    },
} );

/**
 * Tests util.propParse keyword parsing
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
    util   = common.require( 'util' )
;


( function testAbstractKeywordDesignatesMethodAsAbstract()
{
    var data = {
            'abstract foo': [],
        },

        abstract_methods = [],
        parse_data       = {}
    ;


    util.propParse( data, {
        method: function ( name, func, is_abstract )
        {
            if ( is_abstract )
            {
                abstract_methods.push( name );
                parse_data[ name ] = func;
            }
        },
    } );

    assert.ok(
        ( ( abstract_methods.length === 1 )
            && ( abstract_methods[ 0 ] === 'foo' )
        ),
        "Methods with 'abstract' keyword recognized as abstract"
    );
} )();


( function testCustomPropertyKeywordParsersAreSupported()
{
    var data2 = {
            foo: [],
        },

        map = {
            foo: { 'abstract': true },
        },

        suffix = 'poo',

        abstract_methods_2 = []
    ;

    util.propParse( data2, {
        keywordParser: function ( prop )
        {
            return {
                name:     ( prop + suffix ),
                keywords: map[ prop ],
            };
        },


        method: function ( name, func, is_abstract )
        {
            if ( is_abstract )
            {
                abstract_methods_2.push( name );
            }
        },
    } );

    assert.ok(
        ( abstract_methods_2[ 0 ] === ( 'foo' + suffix ) ),
        "Can provide custom property keyword parser"
    );
} )();


( function testKeywordParserToleratesBogusResponses()
{
    assert.doesNotThrow( function()
    {
        var junk = { foo: 'bar' };

        util.propParse( junk, {
            keywordParser: function ( prop )
            {
                // return nothing
            }
        } );

        util.propParse( junk, {
            keywordParser: function ( prop )
            {
                // return bogus name and keywords
                return { name: [], keywords: 'slefwef' };
            }
        } );
    }, Error, "Custom keyword parser tolerates bogus response" );
} )();


( function testParserReturnsKeywords()
{
    var data = {
            'public foo': '',
            'const foo2': '',
            'public private const foo3': '',

            'public static final method': function() {},

            // tricky tricky (lots of spaces)
            'public  const   spaces': function() {},
        },

        parsed_keywords = {},

        expected = {
            foo:  { 'public': true },
            foo2: { 'const': true },
            foo3: { 'public': true, 'private': true, 'const': true },

            method: { 'public': true, 'static': true, 'final': true },

            spaces: { 'public': true, 'const': true },
        }
    ;

    util.propParse( data, {
        property: function( name, value, keywords )
        {
            parsed_keywords[ name ] = keywords;
        },

        method: function( name, func, is_abstract, keywords )
        {
            parsed_keywords[ name ] = keywords;
        },
    } );

    for ( prop in parsed_keywords )
    {
        assert.deepEqual(
            parsed_keywords[ prop ],
            expected[ prop ],
            "Keywords are properly recognized and made available for " +
                "interpretation (" + prop + ")"
        );
    }


    // for browsers that support it
    if ( util.definePropertyFallback() === false )
    {
        data            = {};
        parsed_keywords = {};

        // to prevent syntax errors for environments that don't support
        // getters/setters in object notation
        Object.defineProperty( data, 'public foo', {
            get: function() {},
            set: function() {},

            enumerable: true,
        } );


        util.propParse( data, {
            getter: function( name, value, keywords )
            {
                parsed_keywords[ name + 'g' ] = keywords;
            },

            setter: function( name, value, keywords )
            {
                parsed_keywords[ name + 's' ] = keywords;
            },
        } );

        assert.deepEqual(
            parsed_keywords.foog,
            { 'public': true },
            "Getter keywords are properly recognized and available"
        );

        assert.deepEqual(
            parsed_keywords.foos,
            { 'public': true },
            "Setter keywords are properly recognized and available"
        );
    }
} )();


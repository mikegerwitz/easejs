/**
 * Tests util.propParse keyword parsing
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
        this.Sut = this.require( 'util' );
    },


    /**
     * Use of the `abstract' keyword should result in an abstract method
     * being created from the parameter list.
     */
    '`abstract\' keyword designates method as abstract': function()
    {
        var _self = this;

        var params = [ 'one', 'two' ],
            data   = { 'abstract foo': params },
            found  = null;

        this.Sut.propParse( data, {
            method: function ( name, func, is_abstract )
            {
                _self.assertOk( is_abstract );
                _self.assertEqual( typeof func, 'function' );
                _self.assertOk( _self.Sut.isAbstractMethod( func ) );
                _self.assertEqual( func.__length, params.length );

                found = name;
            },
        } );

        this.assertEqual( found, 'foo' );
    },


    /**
     * As an exception to the above rule, a method shall not considered to be
     * abstract if the `override' keyword is too provided (an abstract
     * override---see the trait tests for more information).
     */
    'Not considered abstract when `override\' also provided': function()
    {
        var _self = this;

        var data  = { 'abstract override foo': function() {} },
            found = null;

        this.Sut.propParse( data, {
            method: function ( name, func, is_abstract )
            {
                _self.assertOk( is_abstract === false );
                _self.assertEqual( typeof func, 'function' );
                _self.assertOk( _self.Sut.isAbstractMethod( func ) === false );

                found = name;
            },
        } );

        this.assertEqual( found, 'foo' );
    },


    /**
     * The idea behind supporting this functionality---which is unsued at
     * the time of writing this test---is to allow eventual customization of
     * ease.js' keywords for domain-specific purposes. Whether or not to
     * expose this feature via a public API will be approached cautiously
     * because it would make classes using custom keyword parsers
     * unportable.
     */
    'Supports custom property keyword parser': function()
    {
        var data = { foo: [] },
            map  = { foo: { 'abstract': true } },

            suffix = 'poo',

            abstract_methods = []
        ;

        this.Sut.propParse( data, {
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
                    abstract_methods.push( name );
                }
            },
        } );

        this.assertOk(
            ( abstract_methods[ 0 ] === ( 'foo' + suffix ) ),
            "Can provide custom property keyword parser"
        );
    },


    /**
     * Since we support custom keyword parsers, we must ensure that we can
     * tolerate crap responses without blowing up.
     */
    'Keyword parser tolerates bogus responses': function()
    {
        var propParse = this.Sut.propParse;

        this.assertDoesNotThrow( function()
        {
            var junk = { foo: 'bar' };

            propParse( junk, {
                keywordParser: function ( prop )
                {
                    // return nothing
                }
            } );

            propParse( junk, {
                keywordParser: function ( prop )
                {
                    // return bogus name and keywords
                    return { name: [], keywords: 'slefwef' };
                }
            } );
        }, Error );
    },


    /**
     * Ensure that all keywords are properly parsed and returned.
     *
     * TODO: This re-tests the property parser, which has its own test case;
     * stub it instead.
     */
    'Parser returns keywords': function()
    {
        var data = {
                'public foo': '',
                'const foo2': '',
                'public private const foo3': '',

                'public static virtual method': function() {},

                // tricky tricky (lots of spaces)
                'public  const   spaces': function() {},
            },

            parsed_keywords = {},

            expected = {
                foo:  { 'public': true },
                foo2: { 'const': true },
                foo3: { 'public': true, 'private': true, 'const': true },

                method: { 'public': true, 'static': true, 'virtual': true },

                spaces: { 'public': true, 'const': true },
            }
        ;

        this.Sut.propParse( data, {
            property: function( name, value, keywords )
            {
                parsed_keywords[ name ] = keywords;
            },

            method: function( name, func, is_abstract, keywords )
            {
                parsed_keywords[ name ] = keywords;
            },
        } );

        for ( var prop in parsed_keywords )
        {
            this.assertDeepEqual(
                parsed_keywords[ prop ],
                expected[ prop ],
                "Keywords are properly recognized and made available for " +
                    "interpretation (" + prop + ")"
            );
        }


        // for browsers that support it
        if ( this.Sut.definePropertyFallback() === false )
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


            this.Sut.propParse( data, {
                getset: function( name, get, set, keywords )
                {
                    get && ( parsed_keywords[ name + 'g' ] = keywords );
                    set && ( parsed_keywords[ name + 's' ] = keywords );
                },
            } );

            this.assertDeepEqual(
                parsed_keywords.foog,
                { 'public': true },
                "Getter keywords are properly recognized and available"
            );

            this.assertDeepEqual(
                parsed_keywords.foos,
                { 'public': true },
                "Setter keywords are properly recognized and available"
            );
        }
    },
} );

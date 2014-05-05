/**
 * Tests util.propParse
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
        this.hasGetSet = !( this.Sut.definePropertyFallback() );

        this.checkType = function( value, type, c )
        {
            this.checkTypeEx( 'foo', { foo: value }, type, c );
        };

        this.checkTypeEx = function( name, data, type, c )
        {
            var obj   = {},
                found = null;

            obj[ type ] = function( name )
            {
                if ( name === name )
                {
                    found = arguments;
                }
            };

            this.Sut.propParse( data, obj );
            this.assertOk( found !== null, "Type failure" );

            c && c.apply( this, found );
        };
    },


    /**
     * Anything that is not treated as a special case defaults to a
     * property.
     */
    'Detects string as property': function()
    {
        this.checkType( 'string', 'property' );
    },
    'Detects boolean as property': function()
    {
        this.checkType( true, 'property' );
        this.checkType( false, 'property' );
    },
    'Detects integer as property': function()
    {
        this.checkType( 1, 'property' );
    },
    'Detects float as property': function()
    {
        this.checkType( 3.14159, 'property' );
    },
    'Detects array as property': function()
    {
        this.checkType( [], 'property' );
    },
    'Detects object as property': function()
    {
        this.checkType( {}, 'property' );
    },


    /**
     * Any function is treated as a method, but a distinaction is made
     * between concrete and abstract.
     */
    'Detects normal functions as concrete methods': function()
    {
        this.checkType( function() {}, 'method', function( _, __, a )
        {
            // should not be abstract
            this.assertOk( !a );
        } );
    },


    /**
     * Abstract methods are marked specially as such using another utility
     * method.
     */
    'Detects special functions as abstract methods': function()
    {
        var func = this.Sut.createAbstractMethod();
        this.checkType( func, 'method', function( _, __, a )
        {
            // should be abstract
            this.assertOk( a );
        } );
    },


    /**
     * Proxies, since their values are strings, would conventionally be
     * considered properties. Therefore, we must ensure that the `proxy'
     * keyword is properly applied to return a method rather than a
     * property.
     */
    'Detects proxies as methods': function()
    {
        var data = { 'proxy foo': 'bar' };
        this.checkTypeEx( 'foo', data, 'method' );
    },


    /**
     * If supported by the environment, getters and setters are properly
     * recognized as such.
     */
    'Detects getters and setters': function()
    {
        this.hasGetSet || this.skip();

        // use defineProperty so that we don't blow up in pre-ES5
        // environments with a syntax error
        var data = {},
            get, set,
            get_called = false;

        Object.defineProperty( data, 'foo', {
            get: ( get = function () { get_called = true; } ),
            set: ( set = function () {} ),

            enumerable: true,
        } );

        this.checkTypeEx( 'foo', data, 'getset', function( _, g, s )
        {
            this.assertStrictEqual( get, g, "Getter mismatch" );
            this.assertStrictEqual( set, s, "Setter mismatch" );

            // bug fix
            this.assertEqual( get_called, false,
                "Getter should not be called during processing"
            );
        } );
    },


    /**
     * The parser should ignore any fields on the prototype.
     */
    'Ignores prototype fields': function()
    {
        var Foo = function() {};
        Foo.prototype.one = 1;

        var instance = new Foo();
        instance.two = 2;

        var found = [];
        this.Sut.propParse( instance, {
            each: function( name )
            {
                found.push( name );
            },
        } );

        // should have only found `two', ignoring `one' on the prototype
        this.assertEqual( found.length, 1 );
        this.assertEqual( found[ 0 ], 'two' );
    },


    /**
     * At this point in time, we are unsure what we will allow within
     * abstract member declarations in the future (e.g. possible type
     * hinting). As such, we will allow only valid variable names for now
     * (like a function definition).
     */
    'Triggers error if invalid variable names are used as param names':
    function()
    {
        var propParse = this.Sut.propParse;

        this.assertThrows( function()
        {
            propParse( { 'abstract foo': [ 'invalid name' ] }, {} );
        }, SyntaxError );

        this.assertThrows( function()
        {
            propParse( { 'abstract foo': [ '1invalid' ] }, {} );
        }, SyntaxError );

        this.assertDoesNotThrow( function()
        {
            propParse( { 'abstract foo': [ 'valid_name' ] }, {} );
        }, SyntaxError );
    },


    /**
     * The motivation behind this feature is to reduce the number of closures
     * necessary to perform a particular task: this allows binding `this' of the
     * handler to a custom context.
     */
    'Supports dynamic context to handlers': function()
    {
        var _self   = this,
            context = {};

        // should trigger all of the handlers
        var all = {
            prop:   'prop',
            method: function() {},
        };

        var get, set;

        // run test on getters/setters only if supported by the environment
        if ( this.hasGetSet )
        {
            Object.defineProperty( all, 'getset', {
                get: ( get = function () {} ),
                set: ( set = function () {} ),

                enumerable: true,
            } );
        }

        function _chk()
        {
            _self.assertStrictEqual( this, context );
        }

        // check each supported handler for conformance
        this.Sut.propParse( all, {
            each:     _chk,
            property: _chk,
            getset:   _chk,
            method:   _chk,
        }, context );
    },
} );

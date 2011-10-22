/**
 * Tests member builder validation rules
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

require( 'common' ).testCase(
{
    setUp: function()
    {
        var _self = this;

        this.sut = this.require( 'MemberBuilderValidator' )();

        /**
         * Tests to ensure that a method with the given keywords fails
         * validation with an error message partially matching the provided
         * identifier
         *
         * To test overrides, specify keywords for 'prev'. To test for success
         * instead of failure, set identifier to null.
         */
        this.quickKeywordMethodTest = function( keywords, identifier, prev )
        {
            var keyword_obj = {},
                prev_obj    = {},
                prev_data   = {},
                name        = 'fooBar';

            // convert our convenient array into a keyword obj
            for ( var i = 0, len = keywords.length; i < len; i++ )
            {
                keyword_obj[ keywords[ i ] ] = true;
            }

            // if prev keywords were given, do the same thing with those to
            // generate our keyword obj
            if ( prev !== undefined )
            {
                for ( var i = 0, len = prev.length; i < len; i++ )
                {
                    prev_obj[ prev[ i ] ] = true;
                }

                // define a dummy previous method value
                prev_data = { member: function() {} };
            }

            var testfunc = function()
            {
                _self.sut.validateMethod(
                    name, function() {}, keyword_obj, prev_data, prev_obj
                );
            };

            if ( identifier )
            {
                _self.quickFailureTest( name, identifier, testfunc );
            }
            else
            {
                _self.assertDoesNotThrow( testfunc, Error );
            }
        };


        this.quickFailureTest = function( name, identifier, action )
        {
            _self.incAssertCount();

            try
            {
                action();
            }
            catch ( e )
            {
                // using the identifier, ensure the error string makes sense
                _self.assertOk( ( e.message.search( identifier ) !== -1 ),
                    "Incorrect error; expected identifier '" + identifier +
                    "', but received: " + e.message
                );

                // to aid in debugging, the error message should contain the
                // name of the method
                _self.assertOk( ( e.message.search( name ) !== -1 ),
                    'Error message should contain method name'
                );

                return;
            }

            _self.fail( "Expected failure" );
        };


        this.quickVisChangeTest = function( start, override, failtest )
        {
            var name  = 'foo',

                startobj    = { 'virtual': true },
                overrideobj = { 'override': true }
            ;

            startobj[ start ]       = true;
            overrideobj[ override ] = true;

            var testfun = function()
            {
                _self.sut.validateMethod(
                    name,
                    function() {},
                    overrideobj,
                    { member: function() {} },
                    startobj
                );
            };

            if ( failtest )
            {
                this.quickFailureTest( name, 'de-escalate', testfun );
            }
            else
            {
                _self.assertDoesNotThrow( testfun, Error );
            }
        };
    },


    /**
     * Private, abstract methods do not make sense. Private methods cannot be
     * overridden.
     */
    'Method cannot be both private and abstract': function()
    {
        this.quickKeywordMethodTest( [ 'private', 'abstract' ],
            'private and abstract'
        );
    },


    /**
     * Methods (in terms of a class) are always immutable. As such, `const'
     * would be redundant.
     */
    'Methods cannot be declared const': function()
    {
        this.quickKeywordMethodTest( [ 'const' ], 'const' );
    },


    /**
     * Virtual static methods do not make sense because static methods can only
     * be hidden, not overridden.
     */
    'Method cannot be both virtual and static': function()
    {
        this.quickKeywordMethodTest( [ 'virtual', 'static' ], 'static' );
    },


    /**
     * Getters/setters are treated as properties and should not be able to be
     * overridden with methods.
     */
    'Cannot override getter/setter with method': function()
    {
        var name  = 'foo',
            _self = this;

        // test getter
        this.quickFailureTest( name, 'getter/setter', function()
        {
            _self.sut.validateMethod(
                name, function() {}, {},
                { get: function() {} },
                {}
            );
        } );

        // test setter
        this.quickFailureTest( name, 'getter/setter', function()
        {
            _self.sut.validateMethod(
                name, function() {}, {},
                { set: function() {} },
                {}
            );
        } );
    },


    /**
     * Although a function can certainly be assigned to a property, we cannot
     * allow /declaring/ a method in place of a parent property, as that alters
     * the interface.
     */
    'Cannot override property with method': function()
    {
        var name  = 'foo',
            _self = this;

        this.quickFailureTest( name, 'property', function()
        {
            // attempt to override a property
            _self.sut.validateMethod(
                name, function() {}, {},
                { member: 'immaprop' },
                {}
            );
        } );
    },


    /**
     * The `virtual' keyword denotes a method that may be overridden. Without
     * it, we should not allow overriding.
     */
    'Cannot override non-virtual methods': function()
    {
        this.quickKeywordMethodTest( [ 'override' ], 'non-virtual', [] );
    },


    /**
     * Ensure we do not prevent legitimate method overriding
     */
    'Can override concrete virtual method with concrete method': function()
    {
        this.quickKeywordMethodTest( [ 'override' ], null, [ 'virtual' ] );
    },


    /**
     * Abstract methods act as a sort of placeholder, requiring an
     * implementation. Once an implementation has been defined, it does not make
     * sense (in the context of inheritance) to remove it entirely by reverting
     * back to an abstract method.
     */
    'Cannot override concrete method with abstract method': function()
    {
        this.quickKeywordMethodTest( [ 'abstract' ], 'concrete', [] );
    },


    /**
     * The parameter list is part of the class interface. Changing the length
     * will make the interface incompatible with that of its parent and make
     * polymorphism difficult. However, since all parameters in JS are
     * technically optional, we can permit extending the parameter list (which
     * itself has its dangers since the compiler cannot detect type errors).
     */
    'Override parameter list must match or exceed parent length': function()
    {
        var name  = 'foo',
            _self = this;

        // check with parent with three params
        this.quickFailureTest( name, 'compatible', function()
        {
            _self.sut.validateMethod(
                name,
                function() {},
                { 'override': true },
                { member: function( a, b, c ) {} },
                { 'virtual': true }
            );
        } );

        // also check with __length property (XXX: testing too closely to the
        // implementation; provide abstraction)
        this.quickFailureTest( name, 'compatible', function()
        {
            var parent_method = function() {};
            parent_method.__length = 3;

            _self.sut.validateMethod(
                name,
                function() {},
                { 'override': true },
                { member: parent_method },
                { 'virtual': true }
            );
        } );

        // finally, check __length of override will actually work (no error)
        this.assertDoesNotThrow( function()
        {
            var method = function() {};
            method.__length = 3;

            _self.sut.validateMethod(
                name,
                method,
                { 'override': true },
                { member: function( a, b, c ) {} },
                { 'virtual': true }
            );
        }, Error );
    },


    /**
     * One should not be able to, for example, declare a private method it had
     * previously been declared protected, or declare it as protected if it has
     * previously been declared public. Again - the reason being interface
     * consistency. Otherwise the concept of polymorphism doesn't work.
     */
    'Methods do not support visibiliy de-escalation': function()
    {
        this.quickVisChangeTest( 'public', 'protected', true );
        this.quickVisChangeTest( 'protected', 'private', true );
    },


    /**
     * To ensure we don't have a bug in our validation, let's also test the
     * reverse - ensure that we support escalation and staying at the same
     * level.
     */
    'Methods support visibility escalation or equality': function()
    {
        var tests = [
            [ 'private',   'protected' ],
            [ 'protected', 'public' ],

            [ 'public',    'public' ],
            [ 'protected', 'protected' ],
            [ 'private',   'private' ]
        ];

        for ( var i = 0, len = tests.length; i < len; i++ )
        {
            var cur = tests[ i ];
            this.quickVisChangeTest( cur[ 0 ], cur[ 1 ], false );
        }
    },


    /**
     * If a parent method is defined and the 'override' keyword is not provided,
     * regardless of whether or not it is declared as virtual, we need to
     * provide an error.
     *
     * Note: In the future, this will be replaced with the method hiding
     * implementation.
     */
    'Must provide "override" keyword when overriding methods': function()
    {
        this.quickKeywordMethodTest( [], 'override', [] );
    },


    /**
     * Building off of the previous test - we should be able to omit the
     * 'override' keyword if we are providing a concrete method for an abstract
     * method. In terms of ease.js, this is still "overriding".
     */
    'Can provide abstract method impl. without override keyword': function()
    {
        this.quickKeywordMethodTest( [], null, [ 'abstract' ] );
    },
} );


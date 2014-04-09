/**
 * Tests member builder validation rules
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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

var shared = require( __dirname + '/inc-common' );


require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        var _self = this;
        this.util = this.require( 'util' );

        this.quickKeywordMethodTest = function( keywords, identifier, prev )
        {
            shared.quickKeywordTest.call( this,
                'validateMethod', keywords, identifier, prev
            );
        };


        this.quickFailureTest = function()
        {
            shared.quickFailureTest.apply( _self, arguments );
        };


        this.quickVisChangeTest = function( start, override, failtest, failstr )
        {
            shared.quickVisChangeTest.call( _self, start, override, failtest,
                function( name, startobj, overrideobj )
                {
                    startobj.virtual     = true;
                    overrideobj.override = true;

                    var state = {};

                    _self.sut.validateMethod(
                        name,
                        function() {},
                        overrideobj,
                        { member: function() {} },
                        startobj,
                        state
                    );

                    _self.sut.end( state );
                },
                failstr
            );
        };
    },


    setUp: function()
    {
        var _self = this;

        // can be used to intercept warnings; redefine in test
        this.warningHandler = function( warning ) {};

        this.sut = this.require( 'MemberBuilderValidator' )(
            function( warning )
            {
                _self.warningHandler( warning );
            }
        );
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
                {}, {}
            );
        } );

        // test setter
        this.quickFailureTest( name, 'getter/setter', function()
        {
            _self.sut.validateMethod(
                name, function() {}, {},
                { set: function() {} },
                {}, {}
            );
        } );
    },


    /**
     * Although a function can certainly be assigned to a property, we cannot
     * allow /declaring/ a method in place of a parent property, as that alters
     * the interface. One may still assign a callback or other function to a
     * property after instantiation.
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
                {}, {}
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
    'Can override virtual method with concrete method': function()
    {
        this.quickKeywordMethodTest( [ 'override' ], null, [ 'virtual' ] );
    },


    /**
     * Overriding a method in ease.js does not immediately make it virtual.
     * Rather, the virtual keyword must be explicitly specified. Let's ensure
     * that it is permitted.
     */
    'Can declare override as virtual': function()
    {
        this.quickKeywordMethodTest( [ 'virtual', 'override' ] );
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
     * Contrary to the above test, an abstract method may appear after its
     * concrete implementation if the `weak' keyword is provided; this
     * exists to allow code generation tools to fall back to abstract
     * without having to invoke the property parser directly, complicating
     * their logic and duplicating work that ease.js will already do.
     */
    'Concrete method may appear with weak abstract method': function()
    {
        this.quickKeywordMethodTest(
            [ 'weak', 'abstract' ], null, []
        );
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
                // this function returns each of its arguments, otherwise
                // they'll be optimized away by Closure Compiler.
                { member: function( a, b, c ) { return [a,b,c]; } },
                { 'virtual': true },
                {}
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
                { 'virtual': true },
                {}
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
                { 'virtual': true },
                {}
            );
        }, Error );
    },


    /**
     * Same concept as the above test, but ensure that the logic for weak
     * abstract members does not skip the valiation. Furthermore, if a weak
     * abstract member is found *after* the concrete definition, the same
     * restrictions should apply retroacively.
     */
    'Weak abstract overrides must meet compatibility requirements':
    function()
    {
        var _self = this,
            name  = 'foo',
            amethod = _self.util.createAbstractMethod( [ 'one' ] );

        // abstract appears before
        this.quickFailureTest( name, 'compatible', function()
        {
            _self.sut.validateMethod(
                name,
                function() {},
                {},
                { member: amethod },
                { 'weak': true, 'abstract': true },
                {}
            );
        } );

        // abstract appears after
        this.quickFailureTest( name, 'compatible', function()
        {
            _self.sut.validateMethod(
                name,
                amethod,
                { 'weak': true, 'abstract': true },
                { member: function() {} },
                {}, {}
            );
        } );
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
        var _self = this;
        shared.visEscalationTest( function( cur )
        {
            _self.quickVisChangeTest( cur[ 0 ], cur[ 1 ], false );
        } );
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


    /**
     * If a developer uses the 'override' keyword when there is no super method
     * to override, this could hint at a number of problems, including:
     *   - Misunderstanding the keyword
     *   - Misspelling the method name
     *   - Forgetting to specify a class to extend from
     *
     * All of the above possibilities are pretty significant. In order to safe
     * developers from themselves (everyone screws up eventually), let's provide
     * a warning. Since this only hints at a potential bug but does not affect
     * the functionality, there's no use in throwing an error and preventing the
     * class from being defined.
     */
    'Throws warning when using override with no super method': function()
    {
        var given = null;

        this.warningHandler = function( warning )
        {
            given = warning;
        };

        // trigger warning (override keyword with no super method)
        this.quickKeywordMethodTest( [ 'override' ] );

        this.assertNotEqual( null, given,
            'No warning was provided'
        );

        this.assertOk( given instanceof Error,
            'Provided warning is not of type Error'
        );

        this.assertOk( ( given.message.search( shared.testName ) > -1 ),
            'Override warning should contain method name'
        );
    },


    /**
     * The above test provides problems if we have a weak method that
     * follows the definition of the override within the same definition
     * object (that is---A' is defined before A where A' overrides A and A
     * is weak); we must ensure that the warning is deferred until we're
     * certain that we will not encounter a weak method.
     */
    'Does not throw warning when overriding a later weak method': function()
    {
        var _self = this;
        this.warningHandler = function( warning )
        {
            _self.fail( true, false, "Warning was issued." );
        };

        this.assertDoesNotThrow( function()
        {
            var state = {};

            // this should place a warning into the state
            _self.sut.validateMethod(
                'foo',
                function() {},
                { 'override': true },
                undefined,  // no previous because weak was
                undefined,  // not yet encountered
                state
            );

            // this should remove it upon encountering `weak'
            _self.sut.validateMethod(
                'foo',
                function() {},
                { 'weak': true, 'abstract': true },
                { member: function() {} },  // same as previously defined
                { 'override': true },       // above
                state
            );

            // hopefully we don't trigger warnings (if we do, the warning
            // handler defined above will fail this test)
            _self.sut.end( state );
        } );
    },


    /**
     * Wait - what? That doesn't make sense from an OOP perspective, now does
     * it! Unfortunately, we're forced into this restriction in order to
     * properly support fallback to pre-ES5 environments where the visibility
     * object is a single layer, rather than three. With this impl, all members
     * are public and private name conflicts would result in supertypes and
     * subtypes altering eachothers' private members (see manual for more
     * information).
     */
    'Cannot redeclare private members in subtypes': function()
    {
        var _self = this;
        shared.privateNamingConflictTest( function( cur )
        {
            _self.quickVisChangeTest( cur[ 0 ], cur[ 1 ], true, 'conflict' );
        } );
    },


    /**
     * Proxies forward calls to other properties of a given instance. The only
     * way to represent those properties is by name, which we will use a string
     * to accomplish. Therefore, the value of a proxy method must be the name of
     * the property to proxy to (as a string).
     */
    "`proxy' keyword must provide string value": function()
    {
        var name  = 'foo',
            _self = this;

        this.quickFailureTest( name, 'string value expected', function()
        {
            // provide function instead of string
            _self.sut.validateMethod(
                name, function() {}, { 'proxy': true }, {}, {}, {}
            );
        } );
    },


    /**
     * Similar to the above test, but asserts that string values are permitted.
     */
    "`proxy' keyword can provide string value": function()
    {
        var _self = this;

        this.assertDoesNotThrow( function()
        {
            _self.sut.validateMethod(
                'foo', 'dest', { 'proxy': true }, {}, {}, {}
            );
        }, TypeError );
    },


    /**
     * It does not make sense for a proxy to be abstract; proxies are concrete
     * by definition (in ease.js' context, at least).
     */
    'Method proxy cannot be abstract': function()
    {
        this.quickKeywordMethodTest( [ 'proxy', 'abstract' ],
            'cannot be abstract'
        );
    },
} );


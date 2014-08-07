/**
 * Tests method builder
 *
 *  Copyright (C) 2010, 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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

        this.testArgs = function( args, name, value, keywords, state )
        {
            shared.testArgs( _self, args, name, value, keywords, state,
                function(
                    prev_default, pval_given, pkey_given
                )
                {
                    var expected = _self.members[ 'public' ][ name ];

                    if ( !expected )
                    {
                        return prev_default;
                    }

                    return {
                        value: {
                            expected: expected,
                            given:    pval_given.member,
                        },
                        keywords: {
                            expected: expected.___$$keywords$$, // XXX
                            given:    pkey_given,
                        },
                    };
                }
            );
        };

        // simply intended to execute test two two perspectives
        this.weakab = [
        ];
    },


    setUp: function()
    {
        var _self = this;

        // stub factories used for testing
        var stubFactory = this.require( 'MethodWrapperFactory' )(
             function( func )
             {
                 // still wrap it so that the function is encapsulated
                 return function() { return func() };
             }
        );

        // used for testing proxies explicitly
        var stubProxyFactory = this.require( 'MethodWrapperFactory' )(
             function()
             {
                _self.proxyFactoryCall =
                    Array.prototype.slice.call( arguments );

                return _self.proxyReturnValue;
             }
        );

        this.proxyFactoryCall = null;
        this.proxyReturnValue = function() {};

        this.sut = this.require( 'MemberBuilder' )(
            stubFactory, stubFactory, stubProxyFactory,
            this.mockValidate = this.getMock( 'MemberBuilderValidator' )
        );

        this.members = this.sut.initMembers();
    },


    /**
     * The validator can only do its job if we're providing it with the correct
     * information
     */
    'Passes proper data to validator when not overriding': function()
    {
        var _self  = this,
            called = false,

            name     = 'foo',
            value    = function() {},
            state    = {},
            keywords = {}
        ;

        this.mockValidate.validateMethod = function()
        {
            called = true;
            _self.testArgs( arguments, name, value, keywords, state );
        };

        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, value, keywords, function() {}, 1, {},
            state
        ) );

        this.assertEqual( true, called, 'validateMethod() was not called' );
    },


    'Passes proper data to validator when overriding': function()
    {
        var _self  = this,
            called = false,

            name     = 'foo',
            value    = function() {},
            keywords = { 'override': true }
        ;

        // since we're overriding
        ( this.members[ 'public' ].foo = function() {} ).___$$keywords$$ =
            { 'public': true };

        this.mockValidate.validateMethod = function()
        {
            called = true;
            _self.testArgs( arguments, name, value, keywords );
        };

        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, value, keywords, function() {}, 1, {}
        ) );

        this.assertEqual( true, called, 'validateMethod() was not called' );
    },


    /**
     * The `proxy' keyword should result in a method that proxies to the given
     * object's method (both identified by name).
     */
    "Creates proxy when `proxy' keyword is given": function()
    {
         var _self  = this,
            called = false,

            cid      = 1,
            name     = 'foo',
            value    = 'bar',
            keywords = { 'proxy': true },

            instCallback = function() {}
        ;

        // build the proxy
        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, value, keywords, instCallback, cid, {}
        ) );

        this.assertNotEqual( null, this.proxyFactoryCall,
            "Proxy factory should be used when `proxy' keyword is provided"
        );

        this.assertDeepEqual(
            [ value, null, cid, instCallback, name, keywords ],
            this.proxyFactoryCall,
            "Proxy factory should be called with proper arguments"
        );

        // ensure it was properly generated (use a strict check to ensure the
        // *proper* value is returned)
        this.assertStrictEqual(
            this.proxyReturnValue,
            this.members[ 'public' ][ name ],
            "Generated proxy method should be properly assigned to members"
        );
    },


    /**
     * A weak abstract method may exist in a situation where a code
     * generator is not certain whether a concrete implementation may be
     * provided. In this case, we would not want to actually create an
     * abstract method if a concrete one already exists.
     */
    'Weak abstract methods are not processed if concrete is available':
    function()
    {
         var _self  = this,
            called = false,

            cid      = 1,
            name     = 'foo',
            cval     = function() { called = true; },
            aval     = [],

            ckeywords = {},
            akeywords = { weak: true, 'abstract': true, },

            instCallback = function() {}
        ;

        // first define abstract
        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, aval, akeywords, instCallback, cid, {}
        ) );

        // concrete should take precedence
        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, cval, ckeywords, instCallback, cid, {}
        ) );

        this.members[ 'public' ].foo();
        this.assertOk( called, "Concrete method did not take precedence" );

        // now try abstract again to ensure this works from both directions
        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, aval, akeywords, instCallback, cid, {}
        ) === false );

        this.members[ 'public' ].foo();
        this.assertOk( called, "Concrete method unkept" );
    },


    /**
     * Same concept as the above, but with virtual methods (which have a
     * concrete implementation available by default).
     */
    'Weak virtual methods are not processed if override is available':
    function()
    {
         var _self  = this,
            called = false,

            cid      = 1,
            name     = 'foo',
            oval     = function() { called = true; },
            vval     = function()
            {
                _self.fail( true, false, "Method not overridden." );
            },

            okeywords = { 'override': true },
            vkeywords = { weak: true, 'virtual': true },

            instCallback = function() {}
        ;

        // define the virtual method
        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, vval, vkeywords, instCallback, cid, {}
        ) );

        // override should take precedence
        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, oval, okeywords, instCallback, cid, {}
        ) );

        this.members[ 'public' ].foo();
        this.assertOk( called, "Override did not take precedence" );

        // now try virtual again to ensure this works from both directions
        this.assertOk( this.sut.buildMethod(
            this.members, {}, name, vval, vkeywords, instCallback, cid, {}
        ) === false );

        this.members[ 'public' ].foo();
        this.assertOk( called, "Override unkept" );
    },


    /**
     * This is a beautiful consequence of the necessay context in which
     * private methods must be invoked.
     *
     * If a method has the ability to call a private method, then we must
     * already be within a private context (that is---using the private
     * member object, which happens whenever we're executing a method of
     * that class). The purpose of the method wrapper is to (a) determine
     * the proper context, (b) set up super method references, and (c)
     * restore the context in the event that the method returns `this'. Not
     * a single one of these applies: (a) is void beacuse we are already in
     * the proper context; (b) is not applicable since private methods
     * cannot have a super method; and (c) we do not need to restore context
     * before returning because the context would be the same (per (a)).
     *
     * That has excellent performance implications: not only do we reduce
     * class building times for private methods, but we also improve method
     * invocation times, since we do not have to invoke a *closure* for each
     * and every method call. Further, recursive private methods are no
     * longer an issue since they do not gobble up the stack faster and,
     * consequently, the JavaScript engine can now take advantage of tail
     * call optimizations.
     *
     * This is also further encouragement to use private members. :)
     */
    'Private methods are not wrapped': function()
    {
        var f    = function() {},
            name = 'foo';

        this.sut.buildMethod(
            this.members, {}, name, f, { 'private': true },
            function() {}, 1, {}
        );

        // if the private method was not wrapped, then it should have been
        // assigned to the member object unencapsulated
        this.assertStrictEqual( this.members[ 'private' ][ name ], f );
    },
} );

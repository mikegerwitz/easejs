/**
 * Tests special handling of Error subtyping
 *
 *  Copyright (C) 2016 Free Software Foundation, Inc.
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
        this.Sut                  = this.require( 'ClassBuilder' );
        this.MethodWrapperFactory = this.require( 'MethodWrapperFactory' );

        this.wrappers = this.require( 'MethodWrappers' ).standard;
        this.util     = this.require( 'util' );

        this.errtypes = [
            Error,
            TypeError,
            SyntaxError,
            ReferenceError,
            EvalError,
            RangeError,
            URIError,
        ];

        this.ctors = [ '__construct', 'constructor' ];
    },


    setUp: function()
    {
        this.stubEctor = {
            createCtor: function() {},
            isError: function() { return true; },
        };

        // XXX: get rid of this disgusting mess; we're mid-refactor and all
        // these dependencies should not be necessary for testing
        this.builder = this.Sut(
            this.require( 'warn' ).DismissiveHandler(),
            this.require( '/MemberBuilder' )(
                this.MethodWrapperFactory( this.wrappers.wrapNew ),
                this.MethodWrapperFactory( this.wrappers.wrapOverride ),
                this.MethodWrapperFactory( this.wrappers.wrapProxy ),
                this.getMock( 'MemberBuilderValidator' )
            ),
            this.require( '/VisibilityObjectFactoryFactory' ).fromEnvironment(),
            this.stubEctor
        );
    },


    /**
     * Any determination as to whether we're extending an error should be
     * left to the error constructor.
     *
     * Note that this test only ensures that the SUT will recognizs
     * non-errors as such; the other tests that follow implicitly test the
     * reverse.
     */
    'Uses constructor generator for error extension determination': function()
    {
        var called = false;

        this.stubEctor.isError = function() { return false; };

        // should not be called
        this.stubEctor.createCtor = function()
        {
            called = true;
        };

        // will invoke createCtor if the isError check fails
        this.builder.build( Error, {} )();

        this.assertOk( !called );
    },


    /**
     * Simple verification that we're passing the correct data to the error
     * constructor.
     */
    '@each(errtypes) Produces error constructor': function( Type )
    {
        this.stubEctor.createCtor = function( supertype, name )
        {
            return function()
            {
                this.givenSupertype = supertype;
                this.givenName      = name;
            };
        };

        var expected_name = 'ename',
            result        = this.builder.build( Type, {
                __name:         expected_name,
                givenSupertype: '',
                givenName:      '',
            } )();

        this.assertEqual( Type, result.givenSupertype );
        this.assertEqual( expected_name, result.givenName );
    },


    /**
     * This is obvious, but since Error is a special case, let's just be
     * sure.
     */
    '@each(errtypes) Error subtype is instanceof parent': function( Type )
    {
        this.assertOk(
            this.builder.build( Type, {} )() instanceof Type
        );
    },


    /**
     * By default, in ES5+ environments that support visibility objects will
     * write to the private visibility object by default, unless the property
     * is declared public.
     */
    'Message and stack are public': function()
    {
        var expected_msg   = 'expected msg',
            expected_stack = 'expected stack';

        this.stubEctor.createCtor = function( supertype, name )
        {
            return function()
            {
                this.message = expected_msg;
                this.stack   = expected_stack;
            };
        };

        var result = this.builder.build( {}, {} )();

        // will only be visible (in ES5 environments at least) if the
        // properties are actually public
        this.assertEqual( expected_msg, result.message );
        this.assertEqual( expected_stack, result.stack );
    },


    /**
     * The default constructor cannot be overridden---it isn't a method on
     * the supertype at all; it's rather just a default
     * implementation.  However, a user can provide a method to be invoked
     * after the generated constructor.
     */
    '@each(ctors) Can override generated constructor': function( ctor )
    {
        var called_gen = false,
            called_own = false;

        this.stubEctor.createCtor = function( supertype, name, after )
        {
            return function()
            {
                called_gen = true;
                after();
            };
        };

        var dfn = {};
        dfn[ ctor ] = function()
        {
            called_own = true;
        };

        var result = this.builder.build( {}, dfn )();

        this.assertOk( called_gen );
        this.assertOk( called_own );
    },
} );

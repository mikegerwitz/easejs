/**
 * Tests member builder validation rules for getters/setters
 *
 * These tests can be run in a pre-ES5 environment since they do not deal with
 * actual getters/setters; they deal only with the data associated with them.
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
 */

var shared = require( __dirname + '/inc-common' );

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        var _self = this;

        this.quickFailureTest = function()
        {
            shared.quickFailureTest.apply( _self, arguments );
        };

        this.quickKeywordTest = function( keywords, identifier, prev )
        {
            shared.quickKeywordTest.call( this,
                'validateGetterSetter', keywords, identifier, prev
            );
        };

        this.quickVisChangeTest = function( start, override, failtest, failstr )
        {
            shared.quickVisChangeTest.call( _self, start, override, failtest,
                function( name, startobj, overrideobj )
                {
                    _self.sut.validateGetterSetter(
                        name, {}, overrideobj,
                        { get: function() {}, set: function() {} },
                        startobj
                    );
                },
                failstr
            );
        };
    },


    setUp: function()
    {
        this.sut = this.require( 'MemberBuilderValidator' )();
    },


    /**
     * Getters/setters should not be able to override methods, for the obvious
     * reason that they are two different types and operate entirely
     * differently. Go figure.
     */
    'Cannot override method with getter or setter': function()
    {
        var name  = 'foo',
            _self = this;

        // getters and setters share the same call, so we don't need two
        // separate tests
        this.quickFailureTest( name, 'method', function()
        {
            _self.sut.validateGetterSetter(
                name, {}, {}, { member: function() {} }
            );
        } );
    },


    'Cannot override property with getter or setter': function()
    {
         var name  = 'foo',
            _self = this;

        // getters and setters share the same call, so we don't need two
        // separate tests
        this.quickFailureTest( name, 'method', function()
        {
            _self.sut.validateGetterSetter(
                name, {}, {}, { member: 'foo' }
            );
        } );
    },


    /**
     * De-escalating the visibility of any member would alter the interface of a
     * subtype, which would not be polymorphic.
     */
    'Getters/setters do not support visibility de-escalation': function()
    {
        this.quickVisChangeTest( 'public', 'protected', true );
        this.quickVisChangeTest( 'protected', 'private', true );
    },


    /**
     * Contrary to the above test, we have no such problem with visibility
     * escalation.
     */
    'Getters/setters support visibility escalation and equality': function()
    {
        var _self = this;
        shared.visEscalationTest( function( cur )
        {
            _self.quickVisChangeTest( cur[ 0 ], cur[ 1 ], false );
        } );
    },


    /**
     * See property/method tests for more information. This is not strictly
     * necessary (since getters/setters can exist only in an ES5+ environment),
     * but it's provided for consistency. It's also easy to remove this feature
     * without breaking BC. The reverse is untrue.
     */
    'Cannot redeclare private getters/setters in subtypes': function()
    {
        var _self = this;
        shared.privateNamingConflictTest( function( cur )
        {
            _self.quickVisChangeTest( cur[ 0 ], cur[ 1 ], true, 'conflict' );
        } );
    },


    /**
     * Abstract getter/setters are not yet supported. They may be supported in
     * the future. Disallowing them now will allow us to determine an
     * implementation in the future without breaking BC.
     */
    'Cannot declare abstract getters/setters': function()
    {
        this.quickKeywordTest( [ 'abstract' ], 'abstract' );
    },


    /**
     * As getters/setters are essentially methods, they are treated very
     * similarity. They cannot be declared as const. Rather, that should be
     * handled by omitting a setter.
     */
    'Cannot declare const getters/setters': function()
    {
        this.quickKeywordTest( [ 'const' ], 'const' );
    },
} );

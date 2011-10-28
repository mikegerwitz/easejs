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
 * @package test
 */

var shared = require( __dirname + '/inc-common' );

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.quickFailureTest = shared.quickFailureTest;
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
                name, {}, { member: function() {} }
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
                name, {}, { member: 'foo' }
            );
        } );
   },
} );

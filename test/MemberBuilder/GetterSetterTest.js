/**
 * Tests MemberBuilder getter/setter builder
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

var common = require( 'common' ),
    shared = require( __dirname + '/inc-common' ),
    es5    = !( common.require( 'util' ).definePropertyFallback() )
;

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
                            expected: null, // XXX
                            given:    pkey_given,
                        },
                    };
                }
            );
        };
    },


    setUp: function()
    {
        // stub factories used for testing
        var stubFactory = this.require( 'MethodWrapperFactory' )(
             function( func ) { return func; }
        );

        this.sut = this.require( 'MemberBuilder' )(
            stubFactory, stubFactory, stubFactory,
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
        es5 || this.skip();

        var _self  = this,
            called = false,

            name      = 'foo',
            value_get = function get() {},
            value_set = function set() {},
            keywords = {}
        ;

        this.mockValidate.validateGetterSetter = function()
        {
            called = true;

            // XXX: Currently no 'value' argument is passed
            _self.testArgs( arguments, name, {}, keywords );
        };

        this.sut.buildGetterSetter( this.members, {}, name,
            value_get, value_set, keywords, {}
        );

        this.assertEqual( true, called,
            'validateGetterSetter() was not called'
        );
    },


    'Passes proper data to validator when overriding': function()
    {
        es5 || this.skip();

        var _self  = this,
            called = false,

            name     = 'foo',
            value_get = function get() {},
            value_set = function set() {},
            keywords = {}
        ;

        // since we're overriding (XXX)
        this.members[ 'public' ][ name ] = {};

        this.mockValidate.validateGetterSetter = function()
        {
            called = true;

            // XXX: Currently no 'value' argument is passed
            _self.testArgs( arguments, name, {}, keywords );
        };

        this.sut.buildGetterSetter( this.members, {}, name,
            value_get, value_set, keywords, {}
        );

        this.assertEqual( true, called,
            'validateGetterSetter() was not called'
        );
    },
} );


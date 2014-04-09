/**
 * Tests MemberBuilder property builder
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
                            expected: expected[ 0 ],
                            given:    pval_given.member[ 0 ],
                        },
                        keywords: {
                            expected: expected[ 1 ],
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
        var _self  = this,
            called = false,

            name     = 'foo',
            value    = 'bar',
            keywords = {}
        ;

        this.mockValidate.validateProperty = function()
        {
            called = true;
            _self.testArgs( arguments, name, value, keywords );
        };

        this.sut.buildProp( this.members, {}, name, value, keywords, {} );

        this.assertEqual( true, called, 'validateProperty() was not called' );
    },


    'Passes proper data to validator when overriding': function()
    {
        var _self  = this,
            called = false,

            name     = 'foo',
            value    = 'bar2',
            keywords = {}
        ;

        // since we're overriding
        this.members[ 'public' ][ name ] = [ 'prev', { 'public': true } ];

        this.mockValidate.validateProperty = function()
        {
            called = true;
            _self.testArgs( arguments, name, value, keywords );
        };

        this.sut.buildProp( this.members, {}, name, value, keywords, {} );

        this.assertEqual( true, called, 'validateProperty() was not called' );
    },
} );


/**
 * Tests method builder
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
    caseSetUp: function()
    {
        var _self = this;

        this.testArgs = function( args, name, value, keywords )
        {
            var pub = _self.members[ 'public' ],

                // prev data
                pval_expect      = null,
                pkeywords_expect = null,
                pval_given       = null,
                pkeywords_given  = null
            ;

            if ( pub[ name ] )
            {
                pval_expect      = pub[ name ];
                pkeywords_expect = pval_expect.___$$keywords$$; // XXX

                pval_given      = args[ 3 ].member;
                pkeywords_given = args[ 4 ];
            }

            _self.assertEqual( name, args[ 0 ],
                'Incorrect name passed to method validator'
            );

            _self.assertStrictEqual( value, args[ 1 ],
                'Incorrect value passed to method validator'
            );

            _self.assertStrictEqual( keywords, args[ 2 ],
                'Incorrect keywords passed to method validator'
            );

            _self.assertStrictEqual( pval_expect, pval_given,
                'Previous data should contain prev value if overriding, ' +
                'otherwise null'
            );

            _self.assertStrictEqual( pkeywords_expect, pkeywords_given,
                'Previous keywords should contain prev keyword if ' +
                'overriding, otherwise null'
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
            stubFactory, stubFactory,
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
            keywords = {}
        ;

        this.mockValidate.validateMethod = function()
        {
            called = true;
            _self.testArgs( arguments, name, value, keywords );
        };

        this.sut.buildMethod(
            this.members, {}, name, value, keywords, function() {}, 1, {}
        );

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

        this.sut.buildMethod(
            this.members, {}, name, value, keywords, function() {}, 1, {}
        );

        this.assertEqual( true, called, 'validateMethod() was not called' );
    },
} );

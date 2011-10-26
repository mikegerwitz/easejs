/**
 * Tests visibility portion of member builder
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

        this.buildStubMethod = function( name, val, visibility )
        {
            var keywords = {};

            // set visibility level using access modifier
            keywords[ visibility ] = true;

            this.sut.buildMethod( this.members, {}, name,
                function() {
                    return val;
                },
                keywords,
                function() {},
                1,
                {}
            );
        };


        this.buildStubProp = function( name, val, visibility )
        {
            var keywords = {};

            // set visibility level using access modifier
            keywords[ visibility ] = true;

            this.sut.buildProp( this.members, {}, name, val, keywords, {} );
        };


        this.assertOnlyIn = function( vis, name )
        {
            var found = false;

            this.incAssertCount();

            for ( level in this.members )
            {
                if ( typeof this.members[ level ][ name ] === 'undefined' )
                {
                    continue;
                }

                // we found it; ensure it's in the expected visibility level
                found = true;
                if ( level !== vis )
                {
                    this.fail( name + " should only be accessible in: " + vis );
                }
            }

            found || this.fail(
                "Did not find '" + name + "' in level: " + vis
            );
        };


        this.basicVisPropTest = function( vis )
        {
            var name = vis + 'name',
                val  = vis + 'val';

            this.buildStubProp( name, val, vis );
            this.assertEqual( this.members[ vis ][ name ][ 0 ], val );

            this.assertOnlyIn( vis, name, this.members );
        };


        this.basicVisMethodTest = function( vis )
        {
            var name = vis + 'name',
                val  = vis + 'val';

            this.buildStubMethod( name, val, vis );

            this.assertEqual(
                this.members[ vis ][ name ](),
                val
            );

            this.assertOnlyIn( vis, name, this.members );
        };


        this.multiVisFailureTest = function( test )
        {
            var multi = [
                    { 'public': true,    'protected': true },
                    { 'public': true,    'private': true },
                    { 'protected': true, 'private': true },
                ],

                name = 'foo'
            ;

            // run the test for each combination of multiple access modifiers
            for ( var i = 0, len = multi.length; i < len; i++ )
            {
                _self.incAssertCount();

                try
                {
                    test( name, multi[ i ] );
                }
                catch ( e )
                {
                    // ensure we received the correct error
                    _self.assertOk(
                        ( e.message.search( 'access modifier' ) > -1 ),
                        'Unexpected error for multiple access modifiers'
                    );

                    // ensure the error message contains the name of the member
                    _self.assertOk(
                        ( e.message.search( name ) > -1 ),
                        'Multiple access modifier error message should ' +
                            'contain name of member'
                    );

                    return;
                }

                _self.fail(
                    'Should fail with multiple access modifiers: ' + i
                );
            }
        };
    },


    setUp: function()
    {
        // stub factories used for testing
        var stubFactory = this.require( 'MethodWrapperFactory' )(
             function( func ) { return func; }
        );

        this.sut = this.require( 'MemberBuilder' )(
            stubFactory, stubFactory
        );

        this.members = this.sut.initMembers();
    },


    'Properties are only accessible via their respective interfaces': function()
    {
        var _self = this,
            tests = [ 'public', 'protected', 'private' ];

        for ( i in tests )
        {
            _self.basicVisPropTest( tests[ i ] );
        };
    },


    'Methods are only accessible via their respective interfaces': function()
    {
        var _self = this;
            tests = [ 'public', 'protected', 'private' ];

        for ( i in tests )
        {
            _self.basicVisMethodTest( tests[ i ] );
        };
    },


    /**
     * If no access modifier is provided, it should be assumed that the member
     * is to be public. This also allows for more concise code should the
     * developer with to omit unnecessary keywords.
     */
    'Members will be declared public if access modifier is omitted': function()
    {
        var name_prop   = 'prop',   val_prop = 'foo',
            name_method = 'method', val_method = function() {}
        ;

        this.sut.buildProp( this.members, {}, name_prop, val_prop, {}, {} );
        this.sut.buildMethod( this.members, {}, name_method, val_method,
            {}, function() {}, 1, {}
        );

        this.assertStrictEqual(
            this.members[ 'public' ][ name_prop ][ 0 ],
            val_prop,
            'Properties should be public by default'
        );

        this.assertStrictEqual(
            this.members[ 'public' ][ name_method ],
            val_method,
            'Methods should be public by default'
        );
    },


    'Only one access modifier may be used per property': function()
    {
        var _self = this;

        this.multiVisFailureTest( function( name, keywords )
        {
            _self.sut.buildProp( _self.members, {}, name, 'baz', keywords, {} );
        } );
    },


    'Only one access modifier may be used per method': function()
    {
        var _self = this;

        this.multiVisFailureTest( function( name, keywords )
        {
            _self.sut.buildMethod(
                _self.members, {}, name, function() {}, keywords, {}
            );
        } );
    },
} );

/**
 * Tests visibility portion of member builder
 *
 *  Copyright (C) 2011, 2012, 2013 Free Software Foundation, Inc.
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

// get-set-test (supported)
var common = require( 'common' ),
    gst    = !( common.require( 'util' ).definePropertyFallback() )


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

            _self.sut.buildMethod( _self.members, {}, name,
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

            _self.sut.buildProp( _self.members, {}, name, val, keywords, {} );
        };


        this.buildStubGetterSetter = function( name, get, set, visibility )
        {
            var keywords = {};

            // set visibility level using access modifier
            keywords[ visibility ] = true;

            _self.sut.buildGetterSetter(
                _self.members, {}, name, get, set, keywords, {}
            );
        };


        this.assertOnlyIn = function( vis, name )
        {
            var found = false;

            _self.incAssertCount();

            for ( var level in _self.members )
            {
                if ( typeof _self.members[ level ][ name ] === 'undefined' )
                {
                    continue;
                }

                // we found it; ensure it's in the expected visibility level
                found = true;
                if ( level !== vis )
                {
                    _self.fail( name + " should only be accessible in: " + vis );
                }
            }

            found || _self.fail(
                "Did not find '" + name + "' in level: " + vis
            );
        };


        this.basicVisPropTest = function( vis )
        {
            var name = vis + 'propname',
                val  = vis + 'val';

            _self.buildStubProp( name, val, vis );
            _self.assertEqual( _self.members[ vis ][ name ][ 0 ], val );

            _self.assertOnlyIn( vis, name, _self.members );
        };


        this.basicVisMethodTest = function( vis )
        {
            var name = vis + 'methodname',
                val  = vis + 'val';

            _self.buildStubMethod( name, val, vis );

            _self.assertEqual(
                _self.members[ vis ][ name ](),
                val
            );

            _self.assertOnlyIn( vis, name, _self.members );
        };


        /** ES5-only **/
        this.basicVisGetterSetterTest = function( vis )
        {
            // we cannot perform these tests if getters/setters are unsupported
            // by our environment
            if ( !gst )
            {
                return;
            }

            var name   = vis + 'getsetname',
                getval = function() { return true; },
                setval = function() {}
            ;

            // build both the getter and the setter
            _self.buildStubGetterSetter( name, getval, setval, vis, 'get' );

            // get the getter/setter
            var data = Object.getOwnPropertyDescriptor(
                _self.members[ vis ], name
            );

            _self.assertEqual( data.get, getval );
            _self.assertEqual( data.set, setval );

            _self.assertOnlyIn( vis, name, _self.members );
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
                            'contain name of member; received: ' + e.message
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
            stubFactory, stubFactory, stubFactory,
            this.getMock( 'MemberBuilderValidator' )
        );

        this.members = this.sut.initMembers();
    },


    /**
     * The member object stores the members associated with each of the three
     * levels of visibility that are denoted by access modifiers: public,
     * protected and private. The initMembers() method is simply an abstraction.
     */
    'Can create empty member object': function()
    {
        var members = this.sut.initMembers(),
            test    = [ 'public', 'protected', 'private' ];

        // ensure each level of visibility exists in the new member object
        // (aren't these for statements terribly repetitive? 0 <= i < len would
        // be nice to be able to do.)
        for ( var i = 0, len = test.length; i < len; i++ )
        {
            this.assertOk( ( typeof members[ test[ i ] ] !== 'undefined' ),
                'Clean member object is missing visibility level: ' + test[ i ]
            );
        }
    },


    /**
     * The initialization method gives us the option to use existing objects
     * for each level of visibility rather than creating new, empty ones.
     */
    'Can initialize member object with existing objects': function()
    {
        var pub  = { foo: 'bar' },
            prot = { bar: 'baz' },
            priv = { baz: 'foo' },

            members = this.sut.initMembers( pub, prot, priv ),

            test = {
                'public':    pub,
                'protected': prot,
                'private':   priv,
            }
        ;

        // ensure we can initialize the values of each visibility level
        for ( var vis in test )
        {
            this.assertStrictEqual( test[ vis ], members[ vis ],
                "Visibility level '" + vis + "' cannot be initialized"
            );
        }
    },


    /**
     * The various members should be copied only to the interface specified by
     * their access modifiers (public, protected, or private).
     */
    'Members are only accessible via their respective interfaces': function()
    {
        var _self = this,
            tests = [ 'public', 'protected', 'private' ];

        for ( var i in tests )
        {
            _self.basicVisPropTest( tests[ i ] );
            _self.basicVisMethodTest( tests[ i ] );
            _self.basicVisGetterSetterTest( tests[ i ] );
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
            name_method = 'method', val_method = function() {},

            name_gs = 'getset',
            getval = function() {},
            setval = function() {}
        ;

        this.sut.buildProp( this.members, {}, name_prop, val_prop, {}, {} );
        this.sut.buildMethod( this.members, {}, name_method, val_method,
            {}, function() {}, 1, {}
        );

        // getter/setter if supported
        if ( gst )
        {
            this.sut.buildGetterSetter(
                this.members, {}, name_gs, getval, setval, {}, {}
            );
        }

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

        // getter/setter if supported
        if ( gst )
        {
            var data = Object.getOwnPropertyDescriptor(
                this.members[ 'public' ], name_gs
            );

            this.assertStrictEqual(
                data.get,
                getval,
                'Getters should be public by default'
            );

            this.assertStrictEqual(
                data.set,
                setval,
                'Setters should be public by default'
            );
        }
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


    'Only one access modifier may be used per getter/setter': function()
    {
        if ( !gst ) return;

        var _self = this;

        this.multiVisFailureTest( function( name, keywords )
        {
            _self.sut.buildGetterSetter(
                _self.members, {}, name,
                function() {}, function() {}, keywords, {}
            );
        } );
    },
} );

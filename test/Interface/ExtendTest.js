/**
 * Tests extending of interfaces
 *
 *  Copyright (C) 2011, 2013 Free Software Foundation, Inc.
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

var common    = require( 'common' ),
    Interface = common.require( 'interface' ),

    // get/set test support
    gst = !( common.require( 'util' ).definePropertyFallback() )
;


common.testCase(
{
    caseSetUp: function()
    {
        // There's a couple ways to create interfaces. Test 'em both.
        this.baseTypes = [
            Interface.extend(
            {
                method: [],
            } ),

            Interface( {
                method: [],
            } )
        ];

        // non-object values to assert failures upon
        this.invalidExtend = [ 'moo', 5, false, undefined ];

        // bad access modifiers (cannot be used in interfaces)
        this.badAm = [ 'protected', 'private' ];
    },


    'Properties are not permitted within interfaces': function()
    {
        this.assertThrows(
            function()
            {
                Interface.extend(
                {
                    // properties are not permitted
                    prop: 'not permitted',
                });
            },
            TypeError,
            "Properties are not permitted within Interface definitions"
        );
    },


    'Getters are setters are not permitted within intefaces': function()
    {
        // don't perform get/set test if unsupported by environment
        if ( !gst )
        {
            return;
        }

        // so we don't break browsers that do not support getters/setters in object
        // notation
        var data = {};
        Object.defineProperty( data, 'foo', {
            get: function() {},
            set: function() {},

            enumerable: true,
        } );

        this.assertThrows( function()
        {
            Interface.extend( data );
        }, TypeError, "Getters/setters not permitted within Interfaces" );
    },


    'Concrete methods are not permitted': function()
    {
        this.assertThrows(
            function()
            {
                Interface.extend(
                {
                    // concrete method
                    method: function() {}
                } );
            },
            TypeError,
            "Concrete methods are not permitted within Interface definitions"
        );
    },


    /**
     * Declaring (but not defining) methods by specifying their arguments as
     * arrays is supported, much like one would would declare an abstract method
     * in a class. We do not require the abstract keyword, as it would be
     * redundant.
     */
    'Method declarations (using arrays) are permitted': function()
    {
        this.assertDoesNotThrow(
            function()
            {
                Interface.extend(
                {
                    method: [],
                } );
            },
            TypeError,
            "Abstract method declarations are allowed within Interface " +
                "definitions"
        );
    },


    /**
     * The defined abstract methods should be included in the resulting
     * interface
     */
    '@each(baseTypes) Interface contains defined abstract methods':
    function( T )
    {
        this.assertOk(
            ( typeof T.prototype.method === 'function' ),
            "Interface should contain defined abstract methods"
        );
    },


    /**
     * The resulting interface should be considered, by the system's
     * isInterface() call, to be an interface. Otherwise that would be a pretty
     * useless call, now wouldn't it?
     */
    '@each(baseTypes) Result is considered to be an interface': function( T )
    {
        this.assertEqual(
            Interface.isInterface( T ),
            true
        );
    },


    /**
     * Interfaces can be extended much like classes. In this case, however, we
     * are only extending the API.
     */
    '@each(baseTypes) Can extend interface using Interface.extend()':
    function( T )
    {
        var SubType = Interface.extend( T, {} );

        this.assertOk(
            ( SubType.prototype instanceof T ),
            "Generic interface extend method should be able to extend from " +
                "other interfaces"
        );
    },


    /**
     * As the term 'extending' would apply, sub-interfaces should 'inherit'
     * their parents' API.
     */
    '@each(baseTypes) Interface subtypes inherit abstract methods':
    function( T )
    {
        var SubType = Interface.extend( T, {} );

        this.assertOk(
            ( SubType.prototype.method === T.prototype.method ),
            "Interface subtypes inherit abstract methods"
        );
    },


    /**
     * One should be able to add additional methods to the API of a
     * sub-interface.
     */
    '@each(baseTypes) Interfaces can extend the API with abstract methods':
    function( T )
    {
        var SubType = Interface.extend( T,
        {
            second: [],
        } );

        this.assertOk(
            ( typeof  SubType.prototype.second === 'function' ),
            "Should be able to extend interfaces with additional abstract " +
                "methods"
        );
    },


    /**
     * Interfaces should contain a built-in extend() method as a short-hand for
     * subtyping.
     */
    '@each(baseTypes) Interfaces contain an extend() method': function( T )
    {
        this.assertOk(
            ( typeof T.extend === 'function' ),
            "Interface should contain extend() method"
        );
    },


    /**
     * Similar to above, but using the interface itself's extend() method
     */
    '@each(baseTypes) extend() method on interface itself can extend':
    function( T )
    {
        var SubType = T.extend( {} );

        this.assertOk(
            ( SubType.prototype instanceof T ),
            "Interface extend method can extend interfaces"
        );
    },


    /**
     * Similar to above, but using the interface itself's extend() method
     */
    '@each(baseTypes) Interface\'s extend() method can add to the API':
    function( T )
    {
        var SubType = T.extend(
        {
            second: [],
        } );

        this.assertOk(
            ( typeof SubType.prototype.second === 'function' ),
            "Interfaces should be able to be extended with additional " +
                "abstract methods using shorthand extend method"
        );
    },


    /**
     * The interface invocation action depends on what arguments are passed in.
     * One use is to pass in an object as the first and only argument, creating
     * a new interface with no supertype.
     */
    '@each(invalidExtend) Invoking module to extend requires object':
    function( val )
    {
        this.assertThrows( function()
            {
                Interface( val );
            },
            TypeError,
            "Invoking interface module should require object as argument if " +
                "extending from base interface"
        );
    },


    /**
     * If defining a new interface (object as the first argument on invocation),
     * then only one argument is permitted.
     */
    'Only one argment for interface definitions is permitted': function()
    {
        var args = [ {}, 'one', 'two', 'three' ];

        // we must only provide one argument if the first argument is an object
        // (the interface definition)
        try
        {
            Interface.apply( null, args );

            // if all goes well, we don't get to this line
            this.fail(
                "Only one argument for interface definitions should be " +
                "permitted"
            );
        }
        catch ( e )
        {
            this.assertOk(
                ( e.message.search( args.length + " given" ) > -1 ),
                "Interface invocation should give argument count on error"
            );
        }
    },


    /**
     * Interfaces represent a public API that must be implemented. It does not
     * make sense to have members be anything but public. If protected members
     * are required, that is appropriate only for an abstract class.
     */
    '@each(badAm) Interface members must be public': function( am )
    {
        // protected
        this.assertThrows( function()
        {
            // am = access modifier
            var dfn = {};
            dfn[ am + ' foo' ] = [];

            Interface( dfn );
        }, Error, "Interface members should not be able to be " + am );
    },


    /**
     * We only want to permit the extending of other interfaces.
     */
    'Interfaces can only extend interfaces': function()
    {
        this.assertThrows( function()
        {
            Interface.extend( function() {}, {} );
        }, TypeError, "Should not be able to extend from non-interface" );
    },
} );


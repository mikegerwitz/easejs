/**
 * Tests extending of interfaces
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

var common    = require( './common' ),
    assert    = require( 'assert' ),
    Interface = common.require( 'interface' ),
    util      = common.require( 'util' )
;


( function testPropertiesNotPermittedWithinInterfaces()
{
    assert.throws( function()
    {
        Interface.extend(
        {
            // properties (non-methods) are not permitted
            prop: 'not permitted',
        });
    }, TypeError, "Properties are not permitted within Interface definitions" );
} )();


( function testGettersAndSettersNotPermittedWithinInterfaces()
{
    // don't perform this test if unsupported by environment
    if ( util.definePropertyFallback() )
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

    assert.throws( function()
    {
        Interface.extend( data );
    }, TypeError, "Getters/setters not permitted within Interfaces" );
} )();


assert.throws( function()
{
    Interface.extend(
    {
        // concrete method
        method: function() {}
    });
}, TypeError, "Concrete methods are not permitted within Interface definitions" );

assert.doesNotThrow(
    function()
    {
        Interface.extend(
        {
            'abstract method': [],
        });
    },
    TypeError,
    "Abstract method declarations are allowed within Interface definitions"
);


// There's a couple ways to create interfaces. Test 'em both.
var base_types = [
    Interface.extend(
    {
        'abstract method': [],
    } ),

    Interface( {
        'abstract method': [],
    } )
];

var BaseType;
for ( var i = 0; i < base_types.length; i++ )
{
    BaseType = base_types[ i ];

    assert.ok(
        ( BaseType.prototype.method instanceof Function ),
        "Interface contains defined abstract methods"
    );

    assert.equal(
        Interface.isInterface( BaseType ),
        true,
        "Interface is considered to be an interface"
    );


    var SubType = Interface.extend( BaseType,
    {
        'abstract second': [],
    });

    assert.ok(
        ( SubType.prototype instanceof BaseType ),
        "Generic interface extend method can extend from other interfaces"
    );

    assert.ok(
        ( SubType.prototype.method === BaseType.prototype.method ),
        "Interface subtypes inherit abstract methods"
    );

    assert.ok(
        ( SubType.prototype.second instanceof Function ),
        "Interfaces can be extended with additional abstract methods"
    );


    assert.ok(
        ( BaseType.extend instanceof Function ),
        "Interface contains extend method"
    );


    var SubType2 = BaseType.extend(
    {
        'abstract second': [],
    });

    assert.ok(
        ( SubType2.prototype instanceof BaseType ),
        "Interface extend method can extend interfaces"
    );

    assert.ok(
        ( SubType2.prototype.second instanceof Function ),
        "Interfaces can be extended with additional abstract methods using " +
            "shorthand extend method"
    );
}


/**
 * The interface invocation action depends on what arguments are passed in. One
 * use is to pass in an object as the first and only argument, creating a new
 * interface with no supertype.
 */
( function testInvokingInterfaceModuleRequiresObjectAsArgumentIfExtending()
{
    assert.throws( function()
        {
            Interface( 'moo' );
            Interface( 5 );
            Interface( false );
            Interface();
        },
        TypeError,
        "Invoking interface module requires object as argument if extending " +
            "from base interface"
    );

    var args = [ {}, 'one', 'two', 'three' ];

    // we must only provide one argument if the first argument is an object (the
    // interface definition)
    try
    {
        Interface.apply( null, args );

        // if all goes well, we don't get to this line
        assert.fail(
            "Only one argument for interface definitions is permitted"
        );
    }
    catch ( e )
    {
        assert.notEqual(
            e.message.match( args.length + ' given' ),
            null,
            "Interface invocation should give argument count on error"
        );
    }
} )();


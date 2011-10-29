/**
 * Tests interface naming
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

var common     = require( './common' ),
    assert     = require( 'assert' ),
    Interface  = common.require( 'interface' ),
    util       = common.require( 'util' )
;


/**
 * Interfaces may be named by passing the name as the first argument to the
 * module
 */
( function testInterfaceAcceptsName()
{
    assert.doesNotThrow( function()
    {
        var iface = Interface( 'Foo', {} );

        assert.equal(
            Interface.isInterface( iface ),
            true,
            "Interface defined with name is returned as a valid interface"
        );
    }, Error, "Interface accepts name" );
} )();


/**
 * The interface definition, which equates to the body of the interface, must be
 * an object
 */
( function testNamedInterfaceDefinitionRequiresThatDefinitionBeAnObject()
{
    var name = 'Foo';

    try
    {
        Interface( name, 'Bar' );

        // if all goes well, we'll never get to this point
        assert.fail(
            "Second argument to named interface must be the definition"
        );
    }
    catch ( e )
    {
        assert.notEqual(
            e.message.match( name ),
            null,
            "Interface definition argument count error string contains " +
                "interface name"
        );
    }
} )();


/**
 * Extraneous arguments likely indicate a misunderstanding of the API
 */
( function testNamedInterfaceDefinitionIsStrictOnArgumentCount()
{
    var name = 'Foo',
        args = [ name, {}, 'extra' ]
    ;

    // we should be permitted only two arguments
    try
    {
        Interface.apply( null, args );

        // we should not get to this line (an exception should be thrown due to
        // too many arguments)
        assert.fail(
            "Should accept only two arguments when creating named interface"
        );
    }
    catch ( e )
    {
        var errstr = e.message;

        assert.notEqual(
            errstr.match( name ),
            null,
            "Named interface error should provide interface name"
        );

        assert.notEqual(
            errstr.match( args.length + ' given' ),
            null,
            "Named interface error should provide number of given arguments"
        );
    }
} )();


/**
 * By default, anonymous interfacees should simply state that they are a
 * interface when they are converted to a string
 */
( function testConvertingAnonymousInterfaceToStringYieldsInterfaceString()
{
    assert.equal(
        Interface( {} ).toString(),
        '[object Interface]',
        "Converting anonymous interface to string yields interface string"
    );
} )();


/**
 * If the interface is named, then the name should be presented when it is
 * converted to a string
 */
( function testConvertingNamedInterfaceToStringYieldsInterfaceStringContainingName()
{
    var name = 'Foo';

    assert.equal(
        Interface( name, {} ).toString(),
        '[object Interface <' + name + '>]',
        "Converting named interface to string yields string with name of " +
            "interface"
    );
} )();


( function testDeclarationErrorsProvideInterfaceNameIsAvailable()
{
    var name = 'Foo',

        // functions used to cause the various errors
        tries = [
            // properties
            function()
            {
                Interface( name, { prop: 'str' } );
            },

            // methods
            function()
            {
                Interface( name, { method: function() {} } );
            },
        ]
    ;

    // if we have getter/setter support, add those to the tests
    if ( !( util.definePropertyFallback() ) )
    {
        // getter
        tries.push( function()
        {
            var obj = {};
            Object.defineProperty( obj, 'getter', {
                get:        function() {},
                enumerable: true,
            } );

            Interface( name, obj );
        } );

        // setter
        tries.push( function()
        {
            var obj = {};
            Object.defineProperty( obj, 'setter', {
                set:        function() {},
                enumerable: true,
            } );

            Interface( name, obj );
        } );
    }

    // gather the error strings
    var i = tries.length;
    while ( i-- )
    {
        try
        {
            // cause the error
            tries[ i ]();
        }
        catch ( e )
        {
            // ensure the error string contains the interface name
            assert.notEqual(
                e.message.match( name ),
                null,
                "Error contains interface name when available (" + i + ")"
            );

            return;
        }

        // we shouldn't get to this point...
        assert.fail( "Expected error. Something's wrong: " + i );
    }
} )();


( function testInterfaceNameIsIncludedInInstantiationError()
{
    var name = 'Foo';

    try
    {
        // this should throw an exception (cannot instantiate interfaces)
        Interface( name )();

        // we should never get here
        assert.fail( "Exception expected. There's a bug somewhere." );
    }
    catch ( e )
    {
        assert.notEqual(
            e.message.match( name ),
            null,
            "Interface name is included in instantiation error message"
        );
    }
} )();


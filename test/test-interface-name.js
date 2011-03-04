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
    Interface  = common.require( 'interface' )
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

    // the second argument must be an object
    assert.throws( function()
    {
        Interface( 'Foo', 'Bar' );
    }, TypeError, "Second argument to named interface must be the definition" );
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


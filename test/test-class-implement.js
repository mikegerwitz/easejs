/**
 * Tests class interface implement method
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
    Class     = common.require( 'class' ),
    Interface = common.require( 'interface' );


var Type = Interface.extend( {
    'abstract foo': [],
});

var Type2 = Interface.extend( {
    'abstract foo2': [],
});


assert.ok(
    ( Class.implement instanceof Function ),
    "Class provides method to implement interfaces"
);

var Foo      = {},
    PlainFoo = Class.extend();

assert.doesNotThrow( function()
{
    Foo = Class.implement( Type, Type2 );
}, Error, "Class can implement interfaces" );

assert.ok(
    ( ( Foo.prototype.foo instanceof Function )
        && ( Foo.prototype.foo2 instanceof Function )
    ),
    "Abstract methods are copied into the new class prototype"
);

assert.equal(
    Foo.isAbstract(),
    true,
    "Classes that implements interface(s) are considered abstract if the " +
        "implemented methods have no concrete implementations"
);

assert.equal(
    Foo.abstractMethods.length,
    2,
    "Abstract methods list is updated when interface is implemented"
);

assert.ok(
    ( ( Foo.abstractMethods[ 0 ] == 'foo' )
        && ( Foo.abstractMethods[ 1 ] == 'foo2' )
    ),
    "Abstract methods list contains names of implemented methods"
);


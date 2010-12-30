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

assert.ok(
    ( PlainFoo.implemented instanceof Array ),
    "Class contains empty list of implemented interfaces if " +
        "none are implemented"
);

assert.doesNotThrow( function()
{
    Foo = Class.implement( Type, Type2 );
}, Error, "Class can implement interfaces" );

assert.ok(
    ( ( Foo.implemented[ 0 ] === Type )
        && ( Foo.implemented[ 1 ] === Type2 )
    ),
    "Class contains list of implemented interfaces"
);

assert.ok(
    ( ( Foo.prototype.foo instanceof Function )
        && ( Foo.prototype.foo2 instanceof Function )
    ),
    "Abstract methods are copied into the new class prototype"
);


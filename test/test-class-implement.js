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

var Foo       = {},
    PlainFoo  = Class.extend(),
    PlainFoo2 = {};

assert.ok(
    ( PlainFoo.implement instanceof Function ),
    "Classes contain an implement() method"
);

assert.doesNotThrow( function()
{
    Foo = Class.implement( Type, Type2 );
}, Error, "Class can implement interfaces" );

assert.ok(
    ( Class.isClass( Foo ) ),
    "Class returned from implementing interfaces on an empty base is a " +
        "valid class"
);

assert.ok(
    ( ( Foo.prototype.foo instanceof Function )
        && ( Foo.prototype.foo2 instanceof Function )
    ),
    "Abstract methods are copied into the new class prototype (empty base)"
);

assert.doesNotThrow( function()
{
    PlainFoo2 = PlainFoo.implement( Type, Type2 );
}, Error, "Concrete classes can implement interfaces" );

assert.ok(
    ( ( PlainFoo2.prototype.foo instanceof Function )
        && ( PlainFoo2.prototype.foo2 instanceof Function )
    ),
    "Abstract methods are copied into the new class prototype (concrete base)"
);

assert.equal(
    ( Foo.isAbstract() && PlainFoo2.isAbstract() ),
    true,
    "Classes that implements interface(s) are considered abstract if the " +
        "implemented methods have no concrete implementations"
);

assert.equal(
    Foo.abstractMethods.length,
    2,
    "Abstract methods list is updated when interface is implemented " +
        "(empty base)"
);

assert.equal(
    PlainFoo2.abstractMethods.length,
    2,
    "Abstract methods list is updated when interface is implemented " +
        "(concrete base)"
);

assert.ok(
    ( ( Foo.abstractMethods[ 0 ] == 'foo' )
        && ( Foo.abstractMethods[ 1 ] == 'foo2' )
    )
    && ( ( PlainFoo2.abstractMethods[ 0 ] == 'foo' )
        && ( PlainFoo2.abstractMethods[ 1 ] == 'foo2' )
    ),
    "Abstract methods list contains names of implemented methods"
);


// concrete implementation so that we can instantiate it
var ConcreteFoo = Foo.extend(
    {
        foo:  function() {},
        foo2: function() {},
    }),

    concrete_inst = new ConcreteFoo();

assert.ok(
    ( concrete_inst.isInstanceOf( Type )
        && concrete_inst.isInstanceOf( Type2 )
    ),
    "Instances of classes implementing interfaces are considered to be " +
        "instances of the implemented interfaces"
);


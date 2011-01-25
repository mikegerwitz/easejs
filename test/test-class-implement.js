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
    }),

    Type2 = Interface.extend( {
        'abstract foo2': [],
    }),

    Foo       = {},
    PlainFoo  = Class.extend(),
    PlainFoo2 = {}
;


( function testClassExportsContainImplementMethodToExtendFromNoBaseClass()
{
    assert.ok(
        ( Class.implement instanceof Function ),
        "Class provides method to implement interfaces"
    );
} )();


( function testClassObjectsContainImplementMethodToImplementUsingItselfAsABase()
{
    assert.ok(
        ( PlainFoo.implement instanceof Function ),
        "Classes contain an implement() method"
    );
} )();


( function testCanImplementInterfaceFromAnEmptyBase()
{
    assert.doesNotThrow( function()
    {
        Foo = Class.implement( Type, Type2 );
    }, Error, "Class can implement interfaces" );

    assert.ok(
        ( Class.isClass( Foo ) ),
        "Class returned from implementing interfaces on an empty base is a " +
            "valid class"
    );
} )();


( function testAbstractMethodsCopiedIntoNewClassUsingEmptyBase()
{
    assert.ok(
        ( ( Foo.prototype.foo instanceof Function )
            && ( Foo.prototype.foo2 instanceof Function )
        ),
        "Abstract methods are copied into the new class prototype (empty base)"
    );
} )();


( function testCanImplementInterfaceAtopAnExistingClass()
{
    assert.doesNotThrow( function()
    {
        PlainFoo2 = PlainFoo.implement( Type, Type2 );
    }, Error, "Classes can implement interfaces" );

    assert.ok(
        ( Class.isClass( PlainFoo2 ) ),
        "Class returned from implementing interfaces on an existing base is a " +
            "valid class"
    );
} )();


( function testAbstractMethodsCopiedIntoNewClassUsingExistingBase()
{
    assert.ok(
        ( ( PlainFoo2.prototype.foo instanceof Function )
            && ( PlainFoo2.prototype.foo2 instanceof Function )
        ),
        "Abstract methods are copied into the new class prototype (concrete base)"
    );
} )();


/**
 * Since interfaces can contain only abstract methods, it stands to reason that
 * any class implementing an interface without providing any concrete methods
 * should be abstract by default.
 */
( function testClassesImplementingInterfacesAreConsideredAbstractByDefault()
{
    assert.equal(
        ( Foo.isAbstract() && PlainFoo2.isAbstract() ),
        true,
        "Classes that implements interface(s) are considered abstract if the " +
            "implemented methods have no concrete implementations"
    );
} ) ();


( function testInstancesOfClassesAreInstancesOfTheirImplementedInterfaces()
{
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

    assert.equal(
        ConcreteFoo.isAbstract(),
        false,
        "Concrete implementations are not considered to be abstract"
    );
} )();


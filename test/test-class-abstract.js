/**
 * Tests abstract classes
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

var common = require( './common' ),
    assert = require( 'assert' ),
    Class  = common.require( 'class' ),
    util   = common.require( 'util' );

// not abstract
var Foo = Class.extend( {} );

// abstract
var AbstractFoo = Class.extend(
{
    ctorCalled: false,

    __construct: function()
    {
        this.ctorCalled = true;
    },

    'abstract method': [ 'one', 'two', 'three' ],

    'abstract second': [],
});

// still abstract (didn't provide a concrete implementation of both abstract
// methods)
var SubAbstractFoo = AbstractFoo.extend(
{
    second: function()
    {
    },
});

// concrete
var ConcreteFoo = AbstractFoo.extend(
{
    method: function( one, two, three )
    {
    },

    second: function()
    {
    },
});


assert.ok(
    ( Foo.isAbstract instanceof Function ),
    "All classes should have an isAbstract() method"
);

assert.ok(
    ( Foo.abstractMethods instanceof Array ),
    "All classes should provide a list of their abstract methods as an array"
);

assert.equal(
    Foo.isAbstract(),
    false,
    "Classes are not abstract if they contain no abstract methods"
);

assert.equal(
    AbstractFoo.isAbstract(),
    true,
    "Classes should be considered abstract if they contain any abstract methods"
);

assert.equal(
    SubAbstractFoo.isAbstract(),
    true,
    "Subtypes of abstract types are abstract if they don't provide a " +
        "concrete implementation for all abstract methods"
);

assert.ok(
    ( ( AbstractFoo.abstractMethods[ 0 ] == 'method' )
        && ( AbstractFoo.abstractMethods[ 1 ] == 'second' )
    ),
    "Abstract classes should provide a list of their abstract methods' names"
);

assert.ok(
    ( ( SubAbstractFoo.abstractMethods[ 0 ] == 'method' )
        && ( SubAbstractFoo.abstractMethods[ 1 ] == undefined )
    ),
    "Abstract subclasses should not have their concrete methods within the " +
        "the abstract method list if the concrete method was abstract in " +
        "its supertype"
);

assert.equal(
    ConcreteFoo.abstractMethods.length,
    0,
    "Concrete classes should not have any abstract methods listed"
);

assert.equal(
    ConcreteFoo.isAbstract(),
    false,
    "Subtypes of abstract types are not abstract if they provide concrete " +
        "implementations of all abstract methods"
);

assert.throws( function()
{
    new AbstractFoo();
    new SubAbstractFoo();
}, Error, "Abstract classes cannot be instantiated" );

assert.ok(
    new ConcreteFoo(),
    "Concrete subclasses can be instantiated"
);

assert.equal(
    ( new ConcreteFoo() ).ctorCalled,
    true,
    "Can call constructors of abstract supertypes"
);


assert.throws( function()
{
    AbstractFoo.extend(
    {
        // incorrect number of arguments
        method: function()
        {
        },
    });
}, Error, "Concrete methods must implement the proper number of argments" );

assert.throws(
    function()
    {
        AbstractFoo.extend(
        {
            // incorrect number of arguments
            'abstract method': [],
        });
    },
    TypeError,
    "Abstract methods of subtypes must implement the proper number of argments"
);

assert.doesNotThrow(
    function()
    {
        AbstractFoo.extend(
        {
            // incorrect number of arguments
            'abstract method': [ 'one', 'two', 'three', 'four' ],
        });
    },
    Error,
    "Abstract methods of subtypes may implement additional arguments, so long" +
        "as they implement at least the required number of arguments as defined by " +
        "it supertype"
);

assert.doesNotThrow(
    function()
    {
        AbstractFoo.extend(
        {
            second: function( foo )
            {
            },
        });
    },
    Error,
    "Concrete methods needn't implement the proper number of arguments if " +
        "no definition was provided"
);


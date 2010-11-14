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

// don't perform these tests if getters/setters are unsupported
if ( Object.prototype.__defineGetter__ === undefined )
{
    return;
}

require( './common' );

var assert         = require( 'assert' ),
    Class          = require( 'class' ),
    abstractMethod = require( 'class' ).abstractMethod;

// not abstract
var Foo = Class.extend( {} );

// abstract
var AbstractFoo = Class.extend(
{
    method: abstractMethod( function( one, two, three ){} ),

    second: abstractMethod(),
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
    ( abstractMethod() instanceof Function ),
    "abstractMethod() returns a function"
);

assert.throws( function()
{
    abstractMethod()();
}, Error, "Abstract methods cannot be called" );

assert.ok(
    ( Foo.isAbstract instanceof Function ),
    "All classes should have an isAbstract() method"
);

assert.equals(
    Foo.isAbstract(),
    false,
    "Classes are not abstract if they contain no abstract methods"
);

assert.equals(
    AbstractFoo.isAbstract(),
    true,
    "Classes should be considered abstract if they contain any abstract methods"
);

assert.equals(
    SubAbstractFoo.isAbstract(),
    true,
    "Subtypes of abstract types are abstract if they don't provide a " +
        "concrete implementation for all abstract methods"
);

assert.equals(
    ConcreteFoo.isAbstract(),
    false,
    "Subtypes of abstract types are not abstract if they provide concrete " +
        "implementations of all abstract methods"
);

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

// abstract (ctor_called is not a class member to ensure that visibility bugs do
// not impact our test)
var ctor_called = false,
    AbstractFoo = Class.extend(
    {
        __construct: function()
        {
            ctor_called = true;
        },

        'abstract method': [ 'one', 'two', 'three' ],

        'abstract second': [],
    })
;

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

ctor_called = false;
new ConcreteFoo();
assert.equal(
    ctor_called,
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


assert.throws( function()
{
    Class.extend(
    {
        // not an array (invalid)
        'abstract foo': 'scalar',
    } );
}, TypeError, "Abstract methods must be declared as arrays" );


// otherwise it'll output the internal constructor code, which is especially
// confusing since the user does not write it
( function testConvertingAbstractClassToStringYieldsClassString()
{
    assert.equal(
        Class.extend( { 'abstract foo': [] } ).toString(),
        '<Abstract Class>',
        "Converting abstract class to string yields class string"
    );
} )();


/**
 * There was an issue where the object holding the abstract methods list was not
 * checking for methods by using hasOwnProperty(). Therefore, if a method such
 * as toString() was defined, it would be matched in the abstract methods list.
 * As such, the abstract methods count would be decreased, even though it was
 * not an abstract method to begin with (nor was it removed from the list,
 * because it was never defined in the first place outside of the prototype).
 *
 * This negative number !== 0, which causes a problem when checking to ensure
 * that there are 0 abstract methods. We check explicitly for 0 for two reasons:
 * (a) it's faster than <, and (b - most importantly) if it's non-zero, then
 * it's either abstract or something is wrong. Negative is especially wrong. It
 * should never be negative!
 */
( function testDoesNotRecognizeObjectPrototypeMembersAsAbstractWhenDefining()
{
    assert.doesNotThrow( function()
    {
        SubAbstractFoo.extend( {
            // concrete, so the result would otherwise not be abstract
            'method': function( one, two, three ) {},

            // the problem
            'toString': function() {},
        })();
    }, Error, "Should not throw error if overriding a prototype method" );
} )();


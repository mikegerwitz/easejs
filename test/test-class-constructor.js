/**
 * Tests class module constructor creation
 *
 *  Copyright (C) 2010, 2011, 2012 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU General Public License as published by the Free Software
 *  Foundation, either version 3 of the License, or (at your option) any later
 *  version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 *  more details.
 *
 *  You should have received a copy of the GNU General Public License along with
 *  this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 */

var common = require( './common' ),
    assert = require( 'assert' ),
    Class  = common.require( 'class' );

// these two variables are declared outside of the class to ensure that they
// will still be set even if the context of the constructor is wrong
var construct_count   = 0,
    construct_context = null,
    construct_args    = null,

// create a basic test class
    Foo = Class.extend(
    {
        __construct: function()
        {
            construct_count++;
            construct_context = this;
            construct_args    = arguments;
        },
    })
;


assert.ok(
    ( Foo.prototype.__construct instanceof Function ),
    "Provided properties should be copied to the new class prototype"
);

assert.equal(
    construct_count,
    0,
    "Constructor should not be called before class is instantiated"
);

var args = [ 'foo', 'bar' ],
    obj  = new Foo( args[0], args[1] );

assert.equal(
    construct_count,
    1,
    "Constructor should be invoked once the class is instantiated"
);

assert.equal(
    construct_context.__iid,
    obj.__iid,
    "Constructor should be invoked within the context of the class instance"
);

assert.notEqual(
    construct_args,
    null,
    "Constructor arguments should be passed to the constructor"
);

assert.equal(
    construct_args.length,
    args.length,
    "All arguments should be passed to the constructor"
);

// check the argument values
for ( var i = 0, len = args.length; i < len; i++ )
{
    assert.equal(
        construct_args[ i ],
        args[ i ],
        "Arguments should be passed to the constructor: " + i
    );
}

var SubFoo = Foo.extend(
{
    args: [ 'should', 'be', 'overwritten' ],
} );

construct_count   = 0;
construct_context = null;

var args2  = [ 'fried', 'pickle' ],
    subobj = new SubFoo( args2[ 0 ], args2[ 1 ] );

assert.equal(
    construct_count,
    1,
    "Parent constructor should be called for subtype if not overridden"
);

assert.equal(
    construct_context.__iid,
    subobj.__iid,
    "Parent constructor is run in context of the subtype"
);

// this should be implied by the previous test, but let's add it for some peace
// of mind
assert.ok(
    ( ( construct_args[ 0 ] === args2[ 0 ] )
        && ( construct_args[ 1 ] == args2[ 1 ] )
    ),
    "Parent constructor sets values on subtype"
);


var subobj2 = SubFoo( args2[ 0 ], args2[ 1 ] );

assert.ok(
    ( subobj2 instanceof SubFoo ),
    "Constructor is self-invoking"
);

assert.equal(
    construct_context.__iid,
    subobj2.__iid,
    "Self-invoking constructor is run in the context of the new object"
);

assert.ok(
    ( ( construct_args[ 0 ] === args2[ 0 ] )
        && ( construct_args[ 1 ] == args2[ 1 ] )
    ),
    "Self-invoking constructor receives arguments"
);


/**
 * In PHP, one would prevent a class from being instantiated by declaring the
 * constructor as protected or private. To me, this is cryptic. A better method
 * would simply be to throw an exception. Perhaps, in the future, an alternative
 * will be provided for consistency.
 *
 * The constructor must be public.
 */
( function testConstructorCannotBeDeclaredAsProtectedOrPrivate()
{
    assert['throws']( function()
    {
        Class( { 'protected __construct': function() {} } );
    }, TypeError, "Constructor cannot be protected" );

    assert['throws']( function()
    {
        Class( { 'private __construct': function() {} } );
    }, TypeError, "Constructor cannot be private" );
} )();


/**
 * When a constructor is instantiated, the instance's 'constructor' property is
 * set to the constructor that was used to instantiate it. The same should be
 * true for class instances.
 *
 * This will also be important for reflection.
 */
( function testConsructorPropertyIsProperlySetToClass()
{
    var Foo = Class( {} );

    assert.ok( Foo().constructor === Foo,
        "Instance constructor should be set to class"
    );
} )();


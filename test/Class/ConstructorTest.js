/**
 * Tests class module constructor creation
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require( 'common' ).testCase(
{
    setUp: function()
    {
        this.Sut = this.require( 'class' );
    },


    /**
     * As a sanity check, ensure that the constructor is not invoked upon
     * defining the class. (Note that the case of ensuring that it is not
     * called when creating a subtype is handled by the ExtendTest case.)
     */
    'Constructor should not be invoked before instantiation': function()
    {
        var called = false;
        this.Sut.extend( { __construct: function() { called = true; } } );

        this.assertNotEqual( called, true );
    },


    /**
     * Since __construct is a special method that is not recognized by
     * ECMAScript itself, we must ensure that it is invoked when the class
     * is instantiated. Further, it should only be called a single time,
     * which is particularly important if it produces side-effects.
     */
    'Constructor should be invoked once upon instantiation': function()
    {
        var called = 0;

        var Foo = this.Sut.extend(
        {
            __construct: function() { called++; }
        } );

        // note that we're not yet testing the more consise new-less
        // invocation style
        new Foo();
        this.assertEqual( called, 1 );
    },


    /**
     * Once invoked, the __construct method should be bound to the newly
     * created instance.
     */
    'Constructor should be invoked within context of new instance':
    function()
    {
        var expected = Math.random();

        var Foo = this.Sut.extend(
            {
                val: null,
                __construct: function() { this.val = expected; }
            } );

        // if `this' was bound to the instance, then __construct should set
        // VAL to EXPECTED
        var inst = new Foo();
        this.assertEqual( inst.val, expected );
    },


    /**
     * All arguments passed to the constructor (that is, by invoking the
     * ``class'') should be passed to __construct, unchanged and
     * uncopied---that is, references should be retained.
     */
    'Constructor arguments should be passed unchanged to __construct':
    function()
    {
        var args  = [ "foo", { bar: 'baz' }, [ 'moo', 'cow' ] ],
            given = null;

        var Foo = this.Sut.extend(
        {
            __construct: function()
            {
                given = Array.prototype.slice.call( arguments, 0 );
            }
        } );

        new Foo( args[ 0 ], args[ 1 ], args[ 2 ] );

        // make sure we have everything and didn't get anything extra
        this.assertEqual( given.length, args.length );

        var i = args.length;
        while ( i-- )
        {
            this.assertStrictEqual( given[ i ], args[ i ],
                "Ctor argument mismatch: " + i
            );
        }
    },


    /**
     * If a subtype does not define its own constructor, then its parent's
     * should be called by default. Note that this behavior---as is clear by
     * the name __construct---is modelled after PHP; Java classes, for
     * instance, do not inherit their parents' constructors.
     */
    'Parent constructor should be invoked for subtype if not overridden':
    function()
    {
        var called = false;

        var Sub = this.Sut.extend(
        {
            __construct: function() { called = true; }
        } ).extend( {} );

        new Sub();
        this.assertOk( called );
    },


    /**
     * Classes created through ease.js do not require use of the `new'
     * keyword, which allows for a much more natural, concise, and less
     * error-prone syntax. Ensure that a new instance is created even when
     * it is omitted.
     *
     * The rest of the tests above would then stand, since they use the
     * `new' keyword and this concise format has no choice but to ultimately
     * do the same; otherwise, it would not be recognized by instanceof.
     */
    'Constructor does not require `new\' keyword': function()
    {
        var Foo = this.Sut.extend( {} );

        this.assertOk( new Foo() instanceof Foo );  // sanity check
        this.assertOk( Foo() instanceof Foo );
    },



    /**
     * In certain OO languages, one would prevent a class from being
     * instantiated by declaring the constructor as protected or private. To
     * me (Mike Gerwitz), this is cryptic. A better method would simply be
     * to throw an exception. Perhaps, in the future, an alternative will be
     * provided for consistency.
     *
     * The constructor must be public. (It is for this reason that you will
     * often see the convention of omitting visibility keywords entirely for
     * __construct, since public is the default and there is no other
     * option.)
     */
    '__construct must be public': function()
    {
        var Sut = this.Sut;

        this.assertThrows( function()
        {
            Sut( { 'protected __construct': function() {} } );
        }, TypeError, "Constructor should not be able to be protected" );

        this.assertThrows( function()
        {
            Sut( { 'private __construct': function() {} } );
        }, TypeError, "Constructor should not be able to be private" );
    },


    /**
     * When a constructor is instantiated conventionally in ECMAScript, the
     * instance's `constructor' property is set to the constructor that was
     * used to instantiate it.  The same should be true for class instances.
     *
     * This will also be important for reflection.
     */
    '`constructor\' property is properly set to class object': function()
    {
        var Foo = this.Sut.extend( {} );
        this.assertStrictEqual( Foo().constructor, Foo );
    },
} );

/**
 * Tests class module object creation
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

        this.Foo = this.Sut.extend(
        {
            value: 'foo',
        } );
    },


    /**
     * The most primitve means of creating a class is by calling the extend
     * method on the module itself, which will extend the base class. (Any
     * shorthand forms still do this.)
     */
    'Class module should provide an extend method': function()
    {
        this.assertOk(
            typeof this.Sut.extend === 'function'
        );
    },


    /**
     * The extend method should create a new constructor, which itself is a
     * function.
     */
    'Extend method creates a new function': function()
    {
        this.assertOk( typeof this.Foo === 'function' );
    },


    /**
     * Sanity check.
     */
    'Classes are considered by the system to be classes': function()
    {
        this.assertOk( this.Sut.isClass( this.Foo ) );
    },


    /**
     * Even though we have no problem working with conventional prototypes,
     * there may be certian features that ease.js provides in which it is
     * important to know whether or not the given object is a class created
     * with ease.js.
     */
    'Only actual classes are considered to be classes': function()
    {
        this.assertOk( !( this.Sut.isClass( {} ) ) );
    },


    /**
     * Class instances are objects, not classes.
     */
    'Class instances are not considered to be classes': function()
    {
        var inst = new this.Foo();
        this.assertOk( !( this.Sut.isClass( inst ) ) );
    },


    /**
     * ease.js may expose features that are useful only to instances of
     * classes created through ease.js, so it is useful to know when an
     * object is such.
     */
    'Class instances are considered to be instances': function()
    {
        var inst = new this.Foo();
        this.assertOk( this.Sut.isClassInstance( inst ) );
    },


    /**
     * An instance is, well, an instance of a class; it is not a class.
     */
    'Classes are not considered to be class instances': function()
    {
        this.assertOk(
            ( !( this.Sut.isClassInstance( this.Foo ) ) )
        );
    },


    /**
     * While an object may be an instance of something in the traditional
     * ECMAScript sense, the distinction is important for the framework; you
     * don't need ease.js to determine if an object is an instance of
     * something that is non-ease.js-y.
     */
    'Non-class objects are not considered to be instances': function()
    {
        // plain 'ol object
        this.assertOk( !( this.Sut.isClassInstance( {} ) ) );

        // ctor instance
        var proto = function() {};
        this.assertOk( !( this.Sut.isClassInstance( new proto() ) ) );
    },


    /**
     * A class shoudl be an immutable blueprint for creating objects. Unlike
     * prototypes, they should not be able to be modified at runtime to
     * affect every instance. If you want that, then use prototypes, not
     * classes.
     */
    'Generated classes should be frozen': function()
    {
        // only perform check if supported by the engine
        if ( Object.isFrozen === undefined )
        {
            return;
        }

        this.assertOk( Object.isFrozen( this.Foo ) );
    },


    /**
     * We provide a reflection mechanism that may be used to determine
     * whether an instance was created from a given class; this can be used
     * for typing.
     */
    'Class instance is recognized as instance of class': function()
    {
        this.assertOk(
            this.Sut.isInstanceOf( this.Foo, new this.Foo() )
        );
    },


    /**
     * We're talking about JS here; people do unpredictable things, and this
     * is likely to be a common one if type checking arguments to a
     * function/method.
     */
    'Checking instance of undefined will not throw an error': function()
    {
        this.assertOk(
            this.Sut.isInstanceOf( this.Foo, undefined ) === false
        );
    },


    /**
     * Similar to the above, but instead of providing undefined to be
     * checked against a class, the class to check against is undefined.
     */
    'Checking for instance of undefined will not throw an error': function()
    {
        this.assertOk(
            this.Sut.isInstanceOf( undefined, {} ) === false
        );
    },


    /**
     * Since a class is not an instance, it should never be recognized as an
     * instance of itself.
     */
    'Class is not an instance of itself': function()
    {
        this.assertOk( !( this.Sut.isInstanceOf( this.Foo, this.Foo ) ) );
    },


    /**
     * Sanity check...prevent confoundentry, which is particularily
     * important in the case of accidental argument order switching.
     */
    'Class is not an instance of its instance': function()
    {
        this.assertOk(
            !( this.Sut.isInstanceOf( new this.Foo(), this.Foo ) )
        );
    },


    /**
     * Sometimes it's easier to think in terms of types, not instances. This
     * is also shorter.
     */
    'isA is an alias for isInstanceOf': function()
    {
        this.assertEqual(
            this.Sut.isInstanceOf,
            this.Sut.isA
        );
    },


    /**
     * While more concise if used responsibly, it can also be dangerous in
     * the event that the instance may not be an ease.js class instance.
     */
    'Class instance has partially applied isInstanceOf method': function()
    {
        var inst = new this.Foo();

        this.assertOk(
            ( ( typeof inst.isInstanceOf === 'function' )
                && ( inst.isInstanceOf( this.Foo ) === true )
                && ( inst.isInstanceOf( inst ) === false )
            )
        );
    },


    /**
     * Same as above.
     */
    'Class instance has partially applied isA alias method': function()
    {
        var inst = new this.Foo();

        this.assertEqual(
            inst.isInstanceOf,
            inst.isA
        );
    },


    /**
     * This really should be encapsulated, probably, but it does exist for
     * reference.
     */
    'Class id is available via class': function()
    {
        this.assertOk( this.Foo.__cid !== undefined );
    },


    /**
     * This ensures that the class id is accessible through all instances.
     */
    'Class id is available via class prototype': function()
    {
        this.assertOk(
            ( this.Foo.prototype.__cid !== undefined )
        );
    },
} );

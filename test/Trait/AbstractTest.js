/**
 * Tests abstract trait definition and use
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
    caseSetUp: function()
    {
        this.Sut           = this.require( 'Trait' );
        this.Class         = this.require( 'class' );
        this.AbstractClass = this.require( 'class_abstract' );
    },


    /**
     * If a trait contains an abstract member, then any class that uses it
     * should too be considered abstract if no concrete implementation is
     * provided.
     */
    'Abstract traits create abstract classes when used': function()
    {
        var T = this.Sut( { 'abstract foo': [] } );

        var _self = this;
        this.assertDoesNotThrow( function()
        {
            // no concrete `foo; should be abstract (this test is sufficient
            // because AbstractClass will throw an error if there are no
            // abstract members)
            _self.AbstractClass.use( T ).extend( {} );
        }, Error );
    },


    /**
     * A class may still be concrete even if it uses abstract traits so long
     * as it provides concrete implementations for each of the trait's
     * abstract members.
     */
    'Concrete classes may use abstract traits by definining members':
    function()
    {
        var T      = this.Sut( { 'abstract traitfoo': [ 'foo' ] } ),
            C      = null,
            called = false;

        var _self = this;
        this.assertDoesNotThrow( function()
        {
            C = _self.Class.use( T ).extend(
            {
                traitfoo: function( foo ) { called = true; },
            } );
        } );

        // sanity check
        C().traitfoo();
        this.assertOk( called );
    },


    /**
     * The concrete methods provided by a class must be compatible with the
     * abstract definitions of any used traits. This test ensures not only
     * that the check is being performed, but that the abstract declaration
     * is properly inherited from the trait.
     *
     * TODO: The error mentions "supertype" compatibility, which (although
     * true) may be confusing; perhaps reference the trait that declared the
     * method as abstract.
     */
    'Concrete classes must be compatible with abstract traits': function()
    {
        var T = this.Sut( { 'abstract traitfoo': [ 'foo' ] } );

        var _self = this;
        this.assertThrows( function()
        {
            C = _self.Class.use( T ).extend(
            {
                // missing param in definition
                traitfoo: function() {},
            } );
        } );
    },


    /**
     * If a trait defines an abstract method, then it should be able to
     * invoke a concrete method of the same name defined by a class.
     */
    'Traits can invoke concrete class implementation of abstract method':
    function()
    {
        var expected = 'foobar';

        var T = this.Sut(
        {
            'public getFoo': function()
            {
                return this.echo( expected );
            },

            'abstract protected echo': [ 'value' ],
        } );

        var result = this.Class.use( T ).extend(
        {
            // concrete implementation of abstract trait method
            'protected echo': function( value )
            {
                return value;
            },
        } )().getFoo();

        this.assertEqual( result, expected );
    },


    /**
     * Even more kinky is when a trait provides a concrete implementation
     * for an abstract method that is defined in another trait that is mixed
     * into the same class. This makes sense, because that class acts as
     * though the trait's abstract method is its own. This allows for
     * message passing between two traits with the class as the mediator.
     *
     * This is otherwise pretty much the same as the above test. Note that
     * we use a public `echo' method; this is to ensure that we do not break
     * in the event that protected trait members break (that is: are not
     * exposed to the class).
     */
    'Traits can invoke concrete trait implementation of abstract method':
    function()
    {
        var expected = 'traitbar';

        // same as the previous test
        var Ta = this.Sut(
        {
            'public getFoo': function()
            {
                return this.echo( expected );
            },

            'abstract public echo': [ 'value' ],
        } );

        // but this is new
        var Tc = this.Sut(
        {
            // concrete implementation of abstract trait method
            'public echo': function( value )
            {
                return value;
            },
        } );

        this.assertEqual(
            this.Class.use( Ta, Tc ).extend( {} )().getFoo(),
            expected
        );

        // order shouldn't matter (because that'd be confusing and
        // frustrating to users, depending on how the traits are named), so
        // let's do this again in reverse order
        this.assertEqual(
            this.Class.use( Tc, Ta ).extend( {} )().getFoo(),
            expected,
            "Crap; order matters?!"
        );
    },


    /**
     * If some trait T used by abstract class C defines abstract method M,
     * then some subtype C' of C should be able to provide a concrete
     * definition of M such that T.M() invokes C'.M.
     */
    'Abstract method inherited from trait can be implemented by subtype':
    function()
    {
        var T = this.Sut(
        {
            'public doFoo': function()
            {
                // should invoke the concrete implementation
                this.foo();
            },

            'abstract protected foo': [],
        } );

        var called = false;

        // C is a concrete class that extends an abstract class that uses
        // trait T
        var C = this.AbstractClass.use( T ).extend( {} )
            .extend(
            {
                // concrete definition that should be invoked by T.doFoo
                'protected foo': function()
                {
                    called = true;
                },
            } );

        C().doFoo();
        this.assertOk( called );
    },


    /**
     * Ensure that chained mixins (that is, calling `use' multiple times
     * independently) maintains the use of AbstractClass, and properly
     * performs the abstract check at the final `extend' call.
     */
    'Chained mixins properly carry abstract flag': function()
    {
        var _self = this,
            Ta    = this.Sut( { foo: function() {} } ),
            Tc    = this.Sut( { baz: function() {} } ),
            Tab   = this.Sut( { 'abstract baz': [] } );

        // ensure that abstract definitions are carried through properly
        this.assertDoesNotThrow( function()
        {
            // single, abstract
            _self.assertOk(
                _self.AbstractClass
                    .use( Tab )
                    .extend( {} )
                    .isAbstract()
            );

            // single, concrete
            _self.assertOk(
                _self.AbstractClass
                    .use( Ta )
                    .extend( { 'abstract baz': [] } )
                    .isAbstract()
            );

            // chained, both
            _self.assertOk(
                _self.AbstractClass
                    .use( Ta )
                    .use( Tab )
                    .extend( {} )
                    .isAbstract()

            );
            _self.assertOk(
                _self.AbstractClass
                    .use( Tab )
                    .use( Ta )
                    .extend( {} )
                    .isAbstract()
            );
        } );

        // and then ensure that we will properly throw an exception if not
        this.assertThrows( function()
        {
            // not abstract
            _self.AbstractClass.use( Tc ).extend( {} );
        } );

        this.assertThrows( function()
        {
            // initially abstract, but then not (by extend)
            _self.AbstractClass.use( Tab ).extend(
            {
                // concrete definition; no longer abstract
                baz: function() {},
            } );
        } );

        this.assertThrows( function()
        {
            // initially abstract, but then second mix provides a concrete
            // definition
            _self.AbstractClass.use( Tab ).use( Tc ).extend( {} );
        } );
    },


    /**
     * Mixins can make a class auto-abstract (that is, not require the use
     * of AbstractClass for the mixin) in order to permit the use of
     * Type.use when the intent is not to subclass, but to decorate (yes,
     * the result is still a subtype). Let's make sure that we're not
     * breaking the AbstractClass requirement, whose sole purpose is to aid
     * in documentation by creating self-documenting code.
     */
    'Explicitly-declared class will not be automatically abstract':
    function()
    {
        var _self = this,
            Tc    = this.Sut( { foo: function() {} } ),
            Ta    = this.Sut( { 'abstract foo': [], } );

        // if we provide no abstract methods, then declaring the class as
        // abstract should result in an error
        this.assertThrows( function()
        {
            // no abstract methods
            _self.assertOk( !(
                _self.AbstractClass.use( Tc ).extend( {} ).isAbstract()
            ) );
        } );

        // similarily, if we provide abstract methods, then there should be
        // no error
        this.assertDoesNotThrow( function()
        {
            // abstract methods via extend
            _self.assertOk(
                _self.AbstractClass.use( Tc ).extend(
                {
                    'abstract bar': [],
                } ).isAbstract()
            );

            // abstract via trait
            _self.assertOk(
                _self.AbstractClass.use( Ta ).extend( {} ).isAbstract()
            );
        } );

        // if we provide abstract methods, then we should not be able to
        // declare a class as concrete
        this.assertThrows( function()
        {
            _self.Class.use( Tc ).extend(
            {
                'abstract bar': [],
            } );
        } );

        // similar to above, but via trait
        this.assertThrows( function()
        {
            _self.Class.use( Ta ).extend();
        } );
    },
} );

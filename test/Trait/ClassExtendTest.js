/**
 * Tests extending traits from classes
 *
 *  Copyright (C) 2015 Free Software Foundation, Inc.
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
        this.FinalClass    = this.require( 'class_final' );

        // nonsensical extend bases that do not support object
        // representations (TODO: use some system-wide understanding of
        // "extendable" values)
        this.nonsense = [
            null,
            undefined,
            false,
            NaN,
            Infinity,
            -Infinity,
        ];
    },


    /**
     * Normally, there are no restrictions on what class a trait may be
     * mixed into.  When ``extending'' a class, we would expect intuitively
     * that this behavior would remain consistent.
     */
    'Trait T extending class C can be mixed into C': function()
    {
        var C = this.Class( {} ),
            T = this.Sut.extend( C, {} );

        this.assertDoesNotThrow( function()
        {
            C.use( T )();
        } );
    },


    /**
     * Restrictions emerge once a disjoint type D attempts to mix in a trait
     * T extending class C.  When C is ``extended'', we are
     * effectively extracting and implementing interfaces representing its
     * public and protected members---this has all the same effects that one
     * would expect from implementing an interface.  However, the act of
     * extension implies a tight coupling between T and C: we're not just
     * expecting a particular interface; we're also expecting the mixee to
     * behave in a certain manner, just as a subtype of C would expect.
     *
     * Traits extending classes therefore behave like conventional subtypes
     * extending their parents, but with a greater degree of
     * flexibility.  We would not expect to be able to use a subtype of C as
     * if it were a disjoint type D, because they are different types: even
     * if they share an identical interface, their intents are
     * distinct.  This is the case here.
     */
    'Trait T extending class C cannot be mixed into disjoint class D':
    function()
    {
        var C = this.Class( {} ),
            D = this.Class( {} ),
            T = this.Sut.extend( C, {} );

        this.assertThrows( function()
        {
            D.use( T )();
        }, TypeError );
    },


    /**
     * Just as some class D' extending supertype D is of both types D' and
     * D, and a trait T implementing interface I is of both types T and I,
     * we would expect that a trait T extending C would be of both types T
     * _and_ C, since T is effectively implementing C's interface.
     */
    'Trait T extending class C is of both types T and C': function()
    {
        var C    = this.Class( {} ),
            T    = this.Sut.extend( C, {} ),
            inst = C.use( T )();

        this.assertOk( this.Class.isA( T, inst ) );
        this.assertOk( this.Class.isA( C, inst ) );
    },


    /**
     * Since a subtype C2 is, by definition, also of type C, we would expect
     * that any traits that are valid to be mixed into type C would also be
     * valid to be mixed into subtypes of C.  This permits trait
     * polymorphism in the same manner as classes and interfaces.
     */
    'Trait T extending class C can be mixed into C subtype C2': function()
    {
        var C  = this.Class( {} ),
            C2 = C.extend( {} ),
            T  = this.Sut.extend( C, {} );

        this.assertDoesNotThrow( function()
        {
            C2.use( T )();
        } );
    },


    /**
     * This is a corollary of the above associations.
     */
    'Trait T extending subtype C2 cannot be mixed into supertype C':
    function()
    {
        var C  = this.Class( {} ),
            C2 = C.extend( {} ),
            T  = this.Sut.extend( C2, {} );

        this.assertThrows( function()
        {
            C.use( T )();
        }, TypeError );
    },


    /**
     * The trait `#extend' method mirrors the syntax of classes: the first
     * argument is the class to be extended, and the second is the actual
     * definition.
     */
    'Trait definition can follow class extension': function()
    {
        var a = ['a'],
            b = ['b'];

        var C = this.Class( {
                foo: function() { return a; }
            } ),
            T = this.Sut.extend( C, {
                bar: function() { return b; }
            } );

        var inst = C.use( T )();

        this.assertStrictEqual( inst.foo(), a );
        this.assertStrictEqual( inst.bar(), b );
    },


    /**
     * This test unfortunately relies on certain implementation details;
     * we're testing at a high level here.
     *
     * When determining what methods need to be proxied for a mixin, ease.js
     * checks certain properties of the supertype.  If the value is
     * null/undefined, then it is not an object, and cannot have any such
     * properties.
     */
    'Trait mixin handles supertype null values': function()
    {
        // note the null value
        var C = this.Class( { foo: null, bar: undefined } ),
            T = this.Sut.extend( C, {} );

        this.assertDoesNotThrow( function()
        {
            C.use( T )();
        } );
    },


    /**
     * This is a corollary, but is still worth testing for assurance.
     *
     * We already stated that a trait Tb extending C's subtype C2 cannot be
     * mixed into C, because C is not of type C2.  But Ta extending C can be
     * mixed into C2, because C2 _is_ of type C.  Therefore, both of these
     * traits should be able to co-mix in the latter situation, but not the
     * former.
     */
    'Trait Ta extending C and Tb extending C2 cannot co-mix': function()
    {
        var C  = this.Class( 'C' ).extend( { _a: null } ),
            C2 = this.Class( 'C2' ).extend( C, { _b: null } ),
            Ta = this.Sut.extend( C, {} ),
            Tb = this.Sut.extend( C2, {} );

        // this is _not_ okay
        this.assertThrows( function()
        {
            C.use( Ta ).use( Tb )();
        } );

        // but this is, since Tb extends C2 itself, and Ta extends C2's
        // supertype
        this.assertDoesNotThrow( function()
        {
            C2.use( Tb ).use( Ta )();
        } );
    },


    /**
     * The `#extend' method for traits, when extending a class, must not
     * accept more than two arguments; otherwise, there may be a bug.  It
     * does not make sense to accept more arguments, since traits can only
     * extend a single class.
     *
     * The reason?  Well, as a corollary of the above, given types
     * C_0,...,C_n to extend: C_x, 0<=x<n, must be equal to or a subtype of
     * each C_i, 0<=x≠i<n, or the types are incompatible.  In that case, the
     * trait could just extend the subtype that has each other type C_i in
     * its lineage, making multiple specifications unnecessary.
     *
     * Does that mean that it's not possible to combine two disjoint classes
     * into one API that is a subtype of both?  Yes, it does: that's
     * multiple inheritance; use interfaces or traits, both of which are
     * designed to solve this problem properly (the latter most closely).
     */
    'Trait class extension cannot supply more than two arguments':
    function()
    {
        var _self = this;

        this.assertThrows( function()
        {
            // extra argument
            _self.Sut.extend( _self.Class( {} ), {}, {} );
        } );
    },


    /**
     * Help out the programmer by letting her know when she provides an
     * invalid base, which would surely not give her the result that she
     * expects.
     */
    '@each(nonsense) Traits cannot extend nonsense': function( base )
    {
        var _self = this;

        this.assertThrows( function()
        {
            _self.Sut.extend( base, {} );
        } );
    },


    /**
     * Eventually, traits will be able to extend other traits just as they
     * can classes---by asserting and operating on the type.  This is just a
     * generalization that needs to be properly tested and allowed, and
     * should not function any differently than a class.
     *
     * Don't worry; it'll happen in the future.
     */
    'Traits cannot yet extend other traits': function()
    {
        var _self = this;

        this.assertThrows( function()
        {
            _self.Sut.extend( _self.Sut( {} ), {} );
        }, TypeError );
    },


    /**
     * For consistency with the rest of the system, final classes are not
     * permitted to be extended.
     */
    'Traits cannot extend final classes': function()
    {
        var _self = this;

        this.assertThrows( function()
        {
            _self.Sut.extend( _self.FinalClass( {} ), {} );
        }, TypeError );
    },


    /**
     * When extending a class C with a concrete implementation for some
     * method M, we should be able to override C#M as T#M and have C#M
     * recognized as its super method.  Just as you would expect when
     * subtyping using classes.
     */
    'Traits can override public virtual super methods': function()
    {
        var super_val = {};

        var C = this.Class(
        {
            'virtual foo': function()
            {
                return super_val;
            }
        } );

        var T = this.Sut.extend( C,
        {
            'override foo': function()
            {
                return { sval: this.__super() };
            }
        } );

        this.assertStrictEqual(
            C.use( T )().foo().sval,
            super_val
        );
    },


    /**
     * Unlike implementing interfaces---which define only public
     * APIs---class can also provide protected methods.  The ability to
     * override protected methods is important, since it allows modifying
     * internal state.  This can be used in place of a Strategy, for
     * example.
     *
     * This otherwise does not differ at all from the public test above.
     */
    'Traits can override protected virtual super methods': function()
    {
        var super_val = {};

        var C = this.Class(
        {
            'virtual protected foo': function()
            {
                return super_val;
            },

            getFoo: function()
            {
                return this.foo();
            },
        } );

        var T = this.Sut.extend( C,
        {
            'override protected foo': function()
            {
                return { sval: this.__super() };
            },
        } );

        this.assertStrictEqual(
            C.use( T )().getFoo().sval,
            super_val
        );
    },


    /**
     * When providing a concrete definition for some abstract method A on
     * interface I, traits must use the `abstract override` keyword, because
     * we cannot know what type of object we will be mixed into---the class
     * could have a concrete implementation, or it may not.
     *
     * This is not the case when extending a class directly.  We should
     * therefore expect that we can provide a concrete definition in the
     * same way we would when subclassing---without any special keywords.
     *
     * Note that we do _not_ have a test to define what happens when
     * `abstract override` _is_ used in this scenario; this was
     * intentionally left undefined, and may or may not be given proper
     * attention in the future.  Don't do it.
     */
    'Traits can provide concrete definition for abstract method': function()
    {
        var expected = {};

        var C = this.AbstractClass(
        {
            foo: function()
            {
                return this.concrete();
            },

            'abstract concrete': [],
        } );

        var T = this.Sut.extend( C,
        {
            concrete: function()
            {
                return expected;
            },
        } );

        this.assertStrictEqual(
            C.use( T )().foo(),
            expected
        );
    },


    /**
     * The stackable property of traits should be preserved under all
     * circumstances (so long as override is virtual).  This is different
     * than subtyping with classes, which would always invoke the
     * supertype's method as the super method.
     *
     * Note the use of `abstract override` here---this is needed for the
     * same reason that it is needed for traits that implement interfaces
     * and want to override concrete methods of a class that it is being
     * mixed into.  The test that follows this one will demonstrate the
     * behavior when a normal `override` is used.
     *
     * See the linearization tests for more information.
     */
    'Trait class method abstract overrides can be stacked': function()
    {
        var C = this.Class(
        {
            'virtual foo': function()
            {
                return 1;
            },
        } );

        var T1 = this.Sut.extend( C,
        {
            'virtual abstract override foo': function()
            {
                return 3 + this.__super();
            },
        } );

        var T2 = this.Sut.extend( C,
        {
            'virtual abstract override foo': function()
            {
                return 13 + this.__super();
            },
        } );

        this.assertEqual(
            20,
            C.use( T1 )
                .use( T1 )
                .use( T2 )
                ().foo()
        );
    },


    /**
     * This test is in the exact same format as the above in order to
     * illustrate the important distinction between the two concepts.
     *
     * This can be confusing---and frustrating to users of an API if its
     * developer does not understand the distinction---but it is important
     * to note that it is consistent with the rest of the system: `override`
     * on its own will always determine the super method at the time of
     * definition, whereas `abstract override` will defer that determination
     * until the time of mixin.
     */
    'Trait class C#M non-abstract override always uses C#M as super':
    function()
    {
        var C = this.Class(
        {
            'virtual foo': function()
            {
                return 1;
            },
        } );

        var T1 = this.Sut.extend( C,
        {
            'virtual override foo': function()
            {
                return 3 + this.__super();
            },
        } );

        var T2 = this.Sut.extend( C,
        {
            'virtual override foo': function()
            {
                return 13 + this.__super();
            },
        } );

        this.assertEqual(
            14,
            C.use( T1 )
                .use( T1 )
                .use( T2 )
                ().foo()
        );
    },


    /**
     * The stackable property should apply when the super class's method is
     * abstract as well---just as it does with interfaces.  Plainly:
     * abstract classes and interfaces are identical in method behavior with
     * the exception that abstract classes can provide concrete
     * implementations.
     *
     * There is one caveat: traits cannot blindly override methods, abstract
     * or concrete---the `override` keyword assumes a concrete method M to
     * act as the super method, which would not exist if the supertype has
     * only an abstract method M.  This is behavior consistent with classes.
     *
     * This is also consistent with Scala's stackable trait pattern: the
     * abstract class C (below) is the "base", T1 acts as the "core", and T2
     * is a "stackable".  This consistency was not intentional, but is a
     * natural evolution for a consistent system.  (It is a desirable
     * consistency, though, so that others can apply their knowledge of
     * Scala---and any other systems motivated by it.)
     */
    'Traits can stack concrete definitions for class abstract methods':
    function()
    {
        var C = this.AbstractClass(
        {
            foo: function()
            {
                return this.concrete();
            },

            'abstract concrete': [],
        } );

        var T1 = this.Sut.extend( C,
        {
            // this cannot be an abstract override, because there is not yet
            // a concrete definition (and we know this immediately, since
            // we're explicitly extending C)
            'virtual concrete': function()
            {
                return 3;
            },
        } );

        var T2 = this.Sut.extend( C,
        {
            // T1 provides a concrete method that we can override
            'virtual abstract override concrete': function()
            {
                return 5 + this.__super();
            },
        } );

        this.assertEqual(
            13,
            C.use( T1 )
                .use( T2 )
                .use( T2 )
                ().foo()
        );
    },
} );

/**
 * Tests trait scoping
 *
 *  Copyright (C) 2014, 2016 Free Software Foundation, Inc.
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
 *
 * These tests could possibly duplicate tests elsewhere; that's fine, as
 * this is a vital concept that wouldn't hurt to be reiterated in a
 * different context (no pun intended).
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut       = this.require( 'Trait' );
        this.Class     = this.require( 'class' );
        this.Interface = this.require( 'interface' );
    },


    /**
     * Since the private scope of classes and the traits that they use are
     * disjoint, traits should never be able to access any private member of
     * a class that uses it.
     *
     * The beauty of this is that we get this ``feature'' for free with
     * our composition-based trait implementation.
     */
    'Private class members are not accessible to used traits': function()
    {
        var T = this.Sut(
        {
            // attempts to access C._priv
            'public getPriv': function() { return this._priv; },

            // attempts to invoke C._privMethod
            'public invokePriv': function() { this._privMethod(); },
        } );

        var inst = this.Class.use( T ).extend(
        {
            'private _priv': 'foo',
            'private _privMethod': function() {},
        } )();

        this.assertEqual( inst.getPriv(), undefined );
        this.assertThrows( function()
        {
            inst.invokePriv();
        }, Error );
    },


    /**
     * Similar concept to the above---class and trait scopes are disjoint.
     * This is particularily important, since traits will have no idea what
     * other traits they will be mixed in with and therefore must be immune
     * from nasty state clashes.
     */
    'Private trait members are not accessible to containing class':
    function()
    {
        var T = this.Sut(
        {
            'private _priv': 'bar',
            'private _privMethod': function() {},
        } );

        // reverse of the previous test case
        var inst = this.Class.use( T ).extend(
        {
            // attempts to access T._priv
            'public getPriv': function() { return this._priv; },

            // attempts to invoke T._privMethod
            'public invokePriv': function() { this._privMethod(); },
        } )();


        this.assertEqual( inst.getPriv(), undefined );
        this.assertThrows( function()
        {
            inst.invokePriv();
        }, Error );
    },


    /**
     * Since all scopes are disjoint, it would stand to reason that all
     * traits should also have their own private scope independent of other
     * traits that are mixed into the same class. This is also very
     * important for the same reasons as the previous test---we cannot have
     * state clashes between traits.
     */
    'Traits do not have access to each others\' private members': function()
    {
        var T1 = this.Sut(
            {
                'private _priv1': 'foo',
                'private _privMethod1': function() {},
            } ),
            T2 = this.Sut(
            {
                // attempts to access T1._priv1
                'public getPriv': function() { return this._priv1; },

                // attempts to invoke T1._privMethod1
                'public invokePriv': function() { this._privMethod1(); },
            } );

        var inst = this.Class.use( T1, T2 ).extend( {} )();

        this.assertEqual( inst.getPriv(), undefined );
        this.assertThrows( function()
        {
            inst.invokePriv();
        }, Error );
    },


    /**
     * If this seems odd at first, consider this: traits provide
     * copy/paste-style functionality, meaning they need to be able to
     * provide public methods. However, we may not always want to mix trait
     * features into a public API; therefore, we need the ability to mix in
     * protected members.
     */
    'Classes can access protected trait members': function()
    {
        var T = this.Sut( { 'protected foo': function() {} } );

        var _self = this;
        this.assertDoesNotThrow( function()
        {
            _self.Class.use( T ).extend(
            {
                // invokes protected trait method
                'public callFoo': function() { this.foo(); }
            } )().callFoo();
        } );
    },


    /**
     * When a class makes a call to a trait method, the calling context
     * should be that of the trait itself (that is, the trait has its own
     * internal state).
     */
    'Class->trait calling context binds to trait': function()
    {
        var T = this.Sut(
        {
            'private _foo': [],
            _givenMixin: null,

            // must be properly bound before mixin
            __mixin: function()
            {
                this._givenMixin = this.get();
            },

            push: function( item )
            {
                this._foo.push( item );
            },

            // make sure calling context is preserved on override
            'virtual overridePush': function( item )
            {
                this._foo.push( item );
            },

            get: function()
            {
                return this._foo;
            },

            getGivenMixin: function()
            {
                return this._givenMixin;
            },
        } );

        var inst = this.Class.use( T ).extend(
        {
            // ensure calling context on T
            superPush: function( item )
            {
                this.push( item );
            },

            'override overridePush': function( item )
            {
                this.__super( item );
            },
        } )();

        inst.push( 'a' );
        inst.superPush( 'b' );
        inst.overridePush( 'c' );

        this.assertDeepEqual( [ 'a', 'b', 'c' ], inst.get() );
        this.assertStrictEqual( inst.get(), inst.getGivenMixin() );
    },


    /**
     * This test focuses on an implementation detail: that traits extending
     * classes literally extend that class.  The problem there is that,
     * because of this detail, calling one of the supertypes methods is
     * going to apply the method within the context of _that
     * trait_.  Remember: each object has private state associated with each
     * class in its hierarchy.  So the class C containing the mixin of trait
     * T has it's own state S_c, and T has its own state T_c because of the
     * extension.  Given C#Foo, calling T#Foo applies T_c rather than the
     * intended C_c.  That is, without proper care.
     *
     * This tests to make sure the context has been properly rebound to the
     * mixer.
     */
    'Trait->class calling context binds to class': function()
    {
        var C = this.Class(
        {
            'private _stack': [],

            'virtual push': function( item )
            {
                this._stack.push( item );
            },

            // non-virtual, test fall-through
            getStack: function()
            {
                return this._stack;
            },
        } );

        var T = this.Sut.extend( C,
        {
            _givenMixin: null,

            // proper context set before __mixin
            __mixin: function()
            {
                this._givenMixin = this.getStack();
            },

            // proper context to __super
            'override push': function( item )
            {
                this.__super( item );
            },

            // proper context to parent `getStack'
            getSuperStack: function()
            {
                return this.getStack();
            },

            getGivenMixin: function()
            {
                return this._givenMixin;
            },
        } );

        var stack = C.use( T )();
        stack.push( 'a' );

        // proper context to parent method call (non-__super)
        this.assertStrictEqual( stack.getStack(), stack.getSuperStack() );

        // proper context to __super
        this.assertDeepEqual( [ 'a' ], stack.getStack() );

        // context available before __mixin
        this.assertStrictEqual( stack.getStack(), stack.getGivenMixin() );
    },


    /**
     * Similar to the above, except that we extend an interface rather than
     * a base class.
     *
     * Notice how T here implements I rather than extending C, and
     * consequently uses `abstract override' in place of `override'.
     *
     * What is interesting in this case is whether this test fails when the
     * previous does not, or vice-versa (such was the case when this test
     * was introduced).
     */
    'Trait->interface calling context binds to implementing class': function()
    {
        var I = this.Interface(
        {
            push:     [ 'item' ],
            getStack: [],
        } );

        var C = this.Class.implement( I ).extend(
        {
            'private _stack': [],

            'virtual push': function( item )
            {
                this._stack.push( item );
            },

            // non-virtual, test fall-through
            getStack: function()
            {
                return this._stack;
            },
        } );

        var T = this.Sut.implement( I ).extend(
        {
            _givenMixin: null,

            // proper context set before __mixin
            __mixin: function()
            {
                this._givenMixin = this.getStack();
            },

            // proper context to __super
            'abstract override push': function( item )
            {
                this.__super( item );
            },

            // proper context to parent `getStack'
            getSuperStack: function()
            {
                return this.getStack();
            },

            getGivenMixin: function()
            {
                return this._givenMixin;
            },
        } );

        var stack = C.use( T )();
        stack.push( 'a' );

        // proper context to parent method call (non-__super)
        this.assertStrictEqual( stack.getStack(), stack.getSuperStack() );

        // proper context to __super
        this.assertDeepEqual( [ 'a' ], stack.getStack() );

        // context available before __mixin
        this.assertStrictEqual( stack.getStack(), stack.getGivenMixin() );
    },
} );

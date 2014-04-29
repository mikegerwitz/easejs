/**
 * Tests class interoperability with vanilla ECMAScript
 *
 *  Copyright (C) 2014 Mike Gerwitz
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
 * Note that these tests all use the `new' keyword for instantiating
 * classes, even though it is not required with ease.js; this is both for
 * historical reasons (when `new' was required during early development) and
 * because we are not testing (and do want to depend upon) that feature.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Class    = this.require( 'class' );
        this.fallback = this.require( 'util' ).definePropertyFallback();
    },


    /**
     * While this may seem at odds with ease.js' philosophy (because ease.js
     * methods are *not* virtual by default), we do not have much choice in
     * the matter: JavaScript is very lax and does not offer a way to
     * declare something as virtual or otherwise. Given that, we have to
     * choose between implicit virtual methods, or never allowing the user
     * to override methods inherited from a prototype. The latter is not a
     * wise choice, since there would be no way to change that behavior.
     *
     * Of course, if such a distinction were important, a wrapper class
     * could be created that simply extends the prototype, marks methods
     * virtual as appropriate, and retain only that reference for use from
     * that point forward.
     */
    'Methods inherited from a prototype are implicitly virtual': function()
    {
        var expected = {};

        var P = function()
        {
            this.foo = function()
            {
                return null;
            };
        }

        var Class = this.Class,
            inst;

        // if an error is thrown here, then we're probably not virtual
        this.assertDoesNotThrow( function()
        {
            inst = Class.extend( P,
            {
                'override foo': function()
                {
                    return expected;
                }
            } )();
        } );

        // the sky is falling if the above worked but this didn't
        this.assertStrictEqual( inst.foo(), expected );
    },


    /**
     * Complement to the above test.
     */
    'Prototype method overrides must provide override keyword': function()
    {
        var P = function()
        {
            this.foo = function() {};
        };

        var Class = this.Class;
        this.assertThrows( function()
        {
            Class.extend( P,
            {
                // missing override keyword
                foo: function() {},
            } );
        } );
    },


    /**
     * This was a subtle bug that creeped up in a class that was derived
     * from a prototype: the prototype was setting its property values
     * (which are of course public), which the class was also manipulating.
     * Unfortunately, the class was manipulating a property of a same name
     * on the private visibility object, whereas the prototype instance was
     * manipulating it on the public. Therefore, the value of the property
     * varied depending on whether you asked the class instance or the
     * prototype instance that it inherited. Yikes.
     *
     * The root issue of this was even more subtle: the parent method (that
     * does the manipulation) was invoked, meaning that it was executed
     * within the context of the private visibility object, which is what
     * caused the issue. However, this issue is still valid regardless of
     * whether a parent method is called.
     *
     * Mitigating this is difficult, so we settle for a combination of good
     * guessing and user education. We assume that all non-function fields
     * set on the object (its own fields---not the prototype chain) by the
     * constructor  are public and therefore need to be proxied, and so
     * implicitly declare them as such. Any remaining properties that are
     * set on the object (e.g. set by methods but not initialized in the
     * ctor) will need to be manually handled by declaring them as public in
     * the class. We test the first case here.
     */
    'Recognizes and proxies prototype properties as public': function()
    {
        var expected  = 'baz',
            expected2 = 'buzz';

        // ctor initializes a single property, which is clearly public (as
        // all fields on an object are)
        var P = function()
        {
            this.foo = 'bar';

            this.updateFoo = function( val )
            {
                this.foo = val;
            };
        };

        var inst = this.Class.extend( P,
        {
            // since updateField is invoked within the context of the
            // instance's private visibility object (unless falling back),
            // we need to ensure that the set of foo is properly proxied
            // back to the public property
            'override updateFoo': function( val )
            {
                // consider that we're now invoking the parent updateFoo
                // within the context of the private visibility object,
                // *not* the public visibility object that it is accustomed
                // to
                this.__super( val );
                return this;
            },

            ownUpdateFoo: function( val )
            {
                this.foo = val;
                return this;
            }
        } )();

        // if detection failed, then the value of foo will still be "bar"
        this.assertEqual( inst.ownUpdateFoo( expected ).foo, expected );

        // another interesting case; they should be mutual, but it's still
        // worth demonstrating (see docblock comments)
        this.assertEqual( inst.updateFoo( expected2 ).foo, expected2 );
    },


    /**
     * This demonstrates what happens if ease.js is not aware of a
     * particular property. This test ensures that the result is as
     * expected.
     *
     * This does not apply in the case of a fallback, because there are not
     * separate visibility objects in that case.
     */
    'Does not recognize non-ctor-initialized properties as public':
    function()
    {
        if ( this.fallback )
        {
            // no separate visibility layers; does not apply
            return;
        }

        var expected = 'bar';

        var P = function()
        {
            this.init = function( val )
            {
                // this was not initialized in the ctor
                this.foo = val;
                return this;
            };
        };

        var inst = this.Class.extend( P,
        {
            rmfoo: function()
            {
                // this is not proxied
                this.foo = undefined;
                return this;
            },

            getFoo: function()
            {
                return this.foo;
            }
        } )();

        // the public foo and the foo visible inside the class are two
        // different references, so rmfoo() will have had no effect on the
        // public API
        this.assertEqual(
            inst.init( expected ).rmfoo().foo,
            expected
        );

        // but it will be visible internally
        this.assertEqual( inst.getFoo(), undefined );
    },


    /**
     * In the case where ease.js is unable to do so automatically, we should
     * be able to correct the proxy situation ourselves. This is where the
     * aforementioned "education" part comes in; it will be documented in
     * the manual.
     */
    'Declaring non-ctor-initialized properties as public resolves proxy':
    function()
    {
        var expected = 'bar';

        var P = function()
        {
            this.init = function()
            {
                // this was not initialized in the ctor
                this.foo = null;
                return this;
            };
        };

        var inst = this.Class.extend( P,
        {
            // the magic
            'public foo': null,

            setFoo: function( val )
            {
                this.foo = val;
                return this;
            }
        } )();

        this.assertEqual( inst.init().setFoo( expected ).foo, expected );
    },


    /**
     * While this should follow as a conseuqence of the above, let's be
     * certain, since it would re-introduce the problems that we are trying
     * to avoid (not to mention it'd be inconsistent with OOP conventions).
     */
    'Cannot de-escalate visibility of prototype properties': function()
    {
        var P = function() { this.foo = 'bar'; };

        var Class = this.Class;
        this.assertThrows( function()
        {
            Class.extend( P,
            {
                // de-escalate from public to protected
                'protected foo': '',
            } );
        } );
    },


    /**
     * This check is probably not necessary, but is added to prevent any
     * potential regressions. This ensures that public methods on the
     * prototype will always return the public visibility object---and they
     * would anyway, since that's the context in which they are invoked
     * through the public API.
     *
     * The only other concern is that when they are invoked by other ease.js
     * methods, then they are passed the private member object as the
     * context. In this case, however, the return value is passed back to
     * the caller (the ease.js method), which properly handles returning the
     * public member object instead.
     */
    'Returning `this` from prototype method yields public obj': function()
    {
        var P = function()
        {
            // when invoked by an ease.js method, is passed private member
            // object
            this.pub = function() { return this; }
        };

        var inst = this.Class.extend( P, {} )();

        // should return itself; we should not have modified that behavior
        this.assertStrictEqual( inst.pub(), inst );
    },


    /**
     * This is a regression test for an interesting (and particularily
     * nasty) bug for a situation that is probably reasonably rare. The
     * original check for a non-class supertype checked whether the
     * supertype was an instance of the internal base class. While this
     * works, it unforunately causes problems for subtypes of the class that
     * extended the prototype---the check will fail, since there is no
     * ClassBase in the prototype chain.
     *
     * This resulted in it processing the class fields, which ended up
     * overwriting ___$$vis$$, which clobbered all the methods. Doh.
     */
    'Subtypes of prototype subtypes yield stable classes': function()
    {
        function P() {};

        // sub-subtype of P
        var expected = {};
        var C = this.Class.extend( P, {} ).extend(
        {
            foo: function() { return expected; }
        } );

        var inst = C();

        // this should be recognized as a class (prior to the fix, it was
        // not), and inst should be an instance of a class
        this.assertOk( this.Class.isClass( C ) );
        this.assertOk( this.Class.isClassInstance( inst ) );
        this.assertOk( this.Class.isA( C, inst ) );

        // before the fix, foo is undefined since ___$$vis$$ was clobbered
        this.assertStrictEqual( inst.foo(), expected );
    },


    /**
     * When prototypally extending a class, it is not wise to invoke the
     * constructor (just like ease.js does not invoke the constructor of
     * subtypes until the supertype is instantiated), as the constructor may
     * validate its arguments, or may even have side-effects. Expose this
     * internal deferral functionality for our prototypal friends.
     *
     * It is incredibly unwise to use this function purely to circumvent the
     * constructor, as classes will use the constructor to ensure that the
     * inststance is in a consistent and expected state.
     *
     * This may also have its uses for stubbing/mocking.
     */
    'Can defer invoking __construct': function()
    {
        var expected = {};

        var C = this.Class(
        {
            __construct: function()
            {
                throw Error( "__construct called!" );
            },

            foo: function() { return expected; },
        } );

        var inst;
        this.assertDoesNotThrow( function()
        {
            inst = C.asPrototype();
        } );

        // should have instantiated C without invoking its constructor
        this.assertOk( this.Class.isA( C, inst ) );

        // we should be able to invoke methods even though the ctor has not
        // yet run
        this.assertStrictEqual( expected, inst.foo() );
    },


    /**
     * Ensure that the prototype is able to invoke the deferred constructor.
     * Let's hope they actually do. This should properly bind the context to
     * whatever was provided; it should not be overridden. But see the test
     * case below.
     */
    'Can invoke constructor within context of prototypal subtype':
    function()
    {
        var expected = {};

        var C = this.Class(
        {
            foo: null,
            __construct: function() { this.foo = expected; },
        } );

        function SubC() { this.__construct.call( this ); }
        SubC.prototype = C.asPrototype();

        this.assertStrictEqual(
            ( new SubC() ).foo,
            expected
        );
    },


    /**
     * Despite being used as part of a prototype, it's important that
     * ease.js' context switching between visibility objects remains active.
     */
    'Deferred constructor still has access to private context': function()
    {
        var expected = {};

        var C = this.Class(
        {
            'private _foo': null,
            __construct: function() { this._foo = expected; },
            getFoo: function() { return this._foo },
        } );

        function SubC() { this.__construct.call( this ); }
        SubC.prototype = C.asPrototype();

        this.assertStrictEqual(
            ( new SubC() ).getFoo(),
            expected
        );
    },
} );


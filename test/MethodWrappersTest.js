/**
 * Tests method sut
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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
        // common assertions between a couple of proxy tests
        this.proxyErrorAssertCommon = function( e, prop, method )
        {
            this.assertOk(
                e.message.search( 'Unable to proxy' ) > -1,
                "Unexpected error received: " + e.message
            );

            this.assertOk(
                ( ( e.message.search( prop ) > -1 )
                    && ( e.message.search( method ) > -1 )
                ),
                "Error should contain property and method names"
            );
        };
    },


    setUp: function()
    {
        this._sut = this.require( 'MethodWrappers' );
    },


    /**
     * The wrappers accept a function that should return the instance to be
     * bound to 'this' when invoking a method. This has some important
     * consequences, such as the ability to implement protected/private members.
     */
    'Method invocation binds `this` to passed instance': function()
    {
        var instance = function() {},
            val      = 'fooboo',
            val2     = 'fooboo2',
            iid      = 1,
            called   = false,

            getInst = function()
            {
                called = true;
                return instance;
            },

            method = this._sut.standard.wrapNew(
                function()
                {
                    return this.foo;
                },
                null, 0, getInst
            ),

            override = this._sut.standard.wrapOverride(
                function()
                {
                    return this.foo2;
                },
                method, 0, getInst
            )
        ;

        // set instance values
        instance.foo  = val;
        instance.foo2 = val2;

        this.assertEqual( method(), val,
            "Calling method will bind 'this' to passed instance"
        );

        this.assertEqual( override(), val2,
            "Calling method override will bind 'this' to passed instance"
        );
    },


    /**
     * The __super property is defined for method overrides and permits invoking
     * the overridden method (method of the supertype).
     *
     * In this test, we are not looking to assert that __super matches the super
     * method. Rather, we want to ensure it /invokes/ it. This is because the
     * super method may be wrapped to provide additional functionality. We don't
     * know, we don't care. We just want to make sure it's functioning properly.
     */
    'Overriden method should contain reference to super method': function()
    {
        var _self       = this,
            orig_called = false,
            getInst     = function() {},

            // "super" method
            method = this._sut.standard.wrapNew(
                function()
                {
                    orig_called = true;
                },
                null, 0, getInst
            ),

            // override method
            override = this._sut.standard.wrapOverride(
                function()
                {
                    _self.assertNotEqual(
                        this.__super,
                        undefined,
                        "__super is defined for overridden method"
                    );

                    this.__super();
                    _self.assertEqual(
                        orig_called,
                        true,
                        "Invoking __super calls super method"
                    );
                },
                method, 0, getInst
            )
        ;

        // invoke the method to run the above assertions
        override();
    },


    /**
     * If the method is called when bound to a different context (e.g. for
     * protected/private members), __super may not be properly bound.
     *
     * This test is in response to a bug found after implementing visibility
     * support. The __super() method was previously defined on 'this', which may
     * or may not be the context that is actually used. Likely, it's not.
     */
    'Super method works properly when context differs': function()
    {
        var super_called = false,
            retobj       = {},

            getInst = function()
            {
                return retobj;
            },

            // super method to be overridden
            method = this._sut.standard.wrapNew(
                function()
                {
                    super_called = true;
                },
                null, 0, getInst
            ),

            // the overriding method
            override = this._sut.standard.wrapOverride(
                function()
                {
                    this.__super();
                },
                method, 0, getInst
            )
        ;

        // call the overriding method
        override();

        // ensure that the super method was called
        this.assertEqual( super_called, true,
            "__super() method is called even when context differs"
        );

        // finally, ensure that __super is no longer set on the returned object
        // after the call to ensure that the caller cannot break encapsulation
        // by stealing a method reference (sneaky, sneaky)
        this.assertEqual( retobj.__super, undefined,
            "__super() method is unset after being called"
        );
    },


    /**
     * While __super is convenient and concise, it is not general-purpose
     * and does not solve the problem of invoking any arbitrary method on
     * the supertype. In particular, we may override some method foo, but
     * wish to call the parent foo in another method; we cannot do that with
     * __super.
     *
     * Note, however, that this will require foo.super.call( this ) to
     * provide the proper context.
     */
    'Can invoke super method by calling override.super': function()
    {
        var expected = {},
            getInst  = function() { return {}; },

            // super method to be overridden
            method = this._sut.standard.wrapNew(
                function() { return expected; },
                null, 0, getInst
            ),

            // the overriding method (we don't care what this does)
            override = this._sut.standard.wrapOverride(
                function() {}, method, 0, getInst
            )
        ;

        // we should be able to invoke the super method by override.super,
        // which is added atop of the wrapper (note that we quote it to avoid
        // problems with ES3 engines)
        this.assertStrictEqual( override['super'](), expected );
    },


    /**
     * The proxy wrapper should forward all arguments to the provided object's
     * appropriate method. The return value should also be proxied back to the
     * caller.
     */
    'Proxy will properly forward calls to destination object': function()
    {
        var name     = 'someMethod',
            propname = 'dest',

            args       = [ 1, {}, 'three' ],
            args_given = [],

            getInst = function()
            {
                return inst;
            },

            method_retval = {},
            dest          = {
                someMethod: function()
                {
                    args_given = Array.prototype.slice.call( arguments );
                    return method_retval;
                },
            },

            // acts like a class instance
            inst = { dest: dest },

            proxy = this._sut.standard.wrapProxy(
                propname, null, 0, getInst, name
            )
        ;

        this.assertStrictEqual( method_retval, proxy.apply( inst, args ),
            "Proxy call should return the value from the destination"
        );

        this.assertDeepEqual( args, args_given,
            "All arguments should be properly forwarded to the destination"
        );
    },


    /**
     * If the destination object returns itself, then we should return the
     * context in which the proxy was called; this ensures that we do not break
     * encapsulation.  Consequently, it also provides a more consistent and
     * sensical API and permits method chaining.
     *
     * If this is not the desired result, then the user is free to forefit the
     * proxy wrapper and instead use a normal method, manually proxying the
     * call.
     */
    'Proxy retval is replaced with context if dest returns self': function()
    {
        var propname = 'foo',
            method   = 'bar',

            foo = {
                bar: function()
                {
                    // return "self"
                    return foo;
                }
            },

            inst = { foo: foo },

            ret = this._sut.standard.wrapProxy(
                propname, null, 0,
                function()
                {
                    return inst;
                },
                method
            ).call( inst )
        ;

        this.assertStrictEqual( inst, ret,
            "Proxy should return instance in place of destination, if returned"
        );
    },


    /**
     * Rather than allowing a cryptic error to be thrown by the engine, take
     * some initiative and attempt to detect when a call will fail due to the
     * destination not being an object.
     */
    'Proxy throws error if call will faill due to non-object': function()
    {
        var prop   = 'noexist',
            method = 'foo';

        try
        {
            // should fail because 'noexist' does not exist on the object
            this._sut.standard.wrapProxy(
                prop, null, 0,
                function() { return {}; },
                method
            )();
        }
        catch ( e )
        {
            this.proxyErrorAssertCommon( e, prop, method );
            return;
        }

        this.assertFail(
            "Error should be thrown if proxy would fail due to a non-object"
        );
    },


    /**
     * Rather than allowing a cryptic error to be thrown by the engine, take
     * some initiative and attempt to detect when a call will fail due to the
     * destination method not being a function.
     */
    'Proxy throws error if call will fail due to non-function': function()
    {
        var prop   = 'dest',
            method = 'foo';

        try
        {
            // should fail because 'noexist' does not exist on the object
            this._sut.standard.wrapProxy(
                prop, null, 0,
                function() { return { dest: { foo: 'notafunc' } }; },
                method
            )();
        }
        catch ( e )
        {
            this.proxyErrorAssertCommon( e, prop, method );
            return;
        }

        this.assertFail(
            "Error should be thrown if proxy would fail due to a non-function"
        );
    },


    /**
     * If the `static' keyword is provided, then the proxy mustn't operate on
     * instance properties. Instead, the static accessor method $() must be
     * used.
     */
    'Can proxy to static members': function()
    {
        var getInst = function()
            {
                // pretend that we're a static class with a static accessor method
                return {
                    $: function( name )
                    {
                        // implicitly tests that the argument is properly passed
                        // (would otherwise return `undefined`)
                        return s[ name ];
                    },
                };
            },

            keywords = { 'static': true },

            val = [ 'value' ],
            s   = {
                // destination object
                foo: {
                    method: function()
                    {
                        return val;
                    },
                }
            };

        this.assertStrictEqual( val,
            this._sut.standard.wrapProxy(
                'foo', null, 0, getInst, 'method', keywords
            )(),
            "Should properly proxy to static membesr via static accessor method"
        );
    },


    /**
     * A proxy method should be able to be used as a concrete implementation
     * for an abstract method; this means that it must properly expose the
     * number of arguments of the method that it is proxying to. The problem
     * is---it can't, because we do not have a type system and so we cannot
     * know what we will be proxying to at runtime!
     *
     * As such, we have no choice (since validations are not at proxy time)
     * but to set the length to something ridiculous so that it will never
     * fail.
     */
    'Proxy methods are able to satisfy abstract method param requirements':
    function()
    {
        var f = this._sut.standard.wrapProxy(
            {}, null, 0, function() {}, '', {}
        );

        this.assertOk( !( 0 < f.__length ) );
    },
} );


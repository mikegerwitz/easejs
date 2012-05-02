/**
 * Tests method sut
 *
 *  Copyright (C) 2010,2011 Mike Gerwitz
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
 */

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' ),
    sut    = common.require( 'MethodWrappers' )
;


/**
 * The wrappers accept a function that should return the instance to be bound to
 * 'this' when invoking a method. This has some important consequences, such as
 * the ability to implement protected/private members.
 */
( function testMethodInvocationBindsThisToPassedInstance()
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

        method = sut.standard.wrapNew(
            function()
            {
                return this.foo;
            },
            null, 0, getInst
        ),

        override = sut.standard.wrapOverride(
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

    assert.equal( method(), val,
        "Calling method will bind 'this' to passed instance"
    );

    assert.equal( override(), val2,
        "Calling method override will bind 'this' to passed instance"
    );
} )();


/**
 * The __super property is defined for method overrides and permits invoking the
 * overridden method (method of the supertype).
 *
 * In this test, we are not looking to assert that __super matches the super
 * method. Rather, we want to ensure it /invokes/ it. This is because the super
 * method may be wrapped to provide additional functionality. We don't know, we
 * don't care. We just want to make sure it's functioning properly.
 */
( function testOverridenMethodShouldContainReferenceToSuperMethod()
{
    var orig_called = false,
        getInst     = function() {},

        // "super" method
        method = sut.standard.wrapNew(
            function()
            {
                orig_called = true;
            },
            null, 0, getInst
        ),

        // override method
        override = sut.standard.wrapOverride(
            function()
            {
                assert.notEqual(
                    this.__super,
                    undefined,
                    "__super is defined for overridden method"
                );

                this.__super();
                assert.equal(
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
} )();


/**
 * If the method is called when bound to a different context (e.g. for
 * protected/private members), __super may not be properly bound.
 *
 * This test is in response to a bug found after implementing visibility
 * support. The __super() method was previously defined on 'this', which may or
 * may not be the context that is actually used. Likely, it's not.
 */
( function testSuperMethodWorksProperlyWhenContextDiffers()
{
    var super_called = false,
        retobj       = {},

        getInst = function()
        {
            return retobj;
        },

        // super method to be overridden
        method = sut.standard.wrapNew(
            function()
            {
                super_called = true;
            },
            null, 0, getInst
        ),

        // the overriding method
        override = sut.standard.wrapOverride(
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
    assert.equal( super_called, true,
        "__super() method is called even when context differs"
    );

    // finally, ensure that __super is no longer set on the returned object
    // after the call to ensure that the caller cannot break encapsulation by
    // stealing a method reference (sneaky, sneaky)
    assert.equal( retobj.__super, undefined,
        "__super() method is unset after being called"
    );
} )();


/**
 * The proxy wrapper should forward all arguments to the provided object's
 * appropriate method. The return value should also be proxied back to the
 * caller.
 */
( function testProxyWillProperlyForwardCallToDestinationObject()
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

        proxy = sut.standard.wrapProxy( propname, null, 0, getInst, name )
    ;

    assert.strictEqual( method_retval, proxy.apply( inst, args ),
        "Proxy call should return the value from the destination"
    );

    assert.deepEqual( args, args_given,
        "All arguments should be properly forwarded to the destination"
    );
} )();


/**
 * If the destination object returns itself, then we should return the context
 * in which the proxy was called; this ensures that we do not break
 * encapsulation.  Consequently, it also provides a more consistent and sensical
 * API and permits method chaining.
 *
 * If this is not the desired result, then the user is free to forefit the proxy
 * wrapper and instead use a normal method, manually proxying the call.
 */
( function testProxyReturnValueIsReplacedWithContextIfDestinationReturnsSelf()
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

        ret = sut.standard.wrapProxy(
            propname, null, 0,
            function()
            {
                return inst;
            },
            method
        ).call( inst )
    ;

    assert.strictEqual( inst, ret,
        "Proxy should return instance in place of destination, if returned"
    );
} )();


// common assertions between a couple of proxy tests
function proxyErrorAssertCommon( e, prop, method )
{
    assert.ok(
        e.message.search( 'Unable to proxy' ) > -1,
        "Unexpected error received: " + e.message
    );

    assert.ok(
        ( ( e.message.search( prop ) > -1 )
            && ( e.message.search( method ) > -1 )
        ),
        "Error should contain property and method names"
    );
}


/**
 * Rather than allowing a cryptic error to be thrown by the engine, take some
 * initiative and attempt to detect when a call will fail due to the destination
 * not being an object.
 */
( function testProxyThrowsErrorIfCallWillFailDueToNonObject()
{
    var prop   = 'noexist',
        method = 'foo';

    try
    {
        // should fail because 'noexist' does not exist on the object
        sut.standard.wrapProxy(
            prop, null, 0,
            function() { return {}; },
            method
        )();
    }
    catch ( e )
    {
        proxyErrorAssertCommon( e, prop, method );
        return;
    }

    assert.fail(
        "Error should be thrown if proxy would fail due to a non-object"
    );
} )();


/**
 * Rather than allowing a cryptic error to be thrown by the engine, take some
 * initiative and attempt to detect when a call will fail due to the destination
 * method not being a function.
 */
( function testProxyThrowsErrorIfCallWillFailDueToNonObject()
{
    var prop   = 'dest',
        method = 'foo';

    try
    {
        // should fail because 'noexist' does not exist on the object
        sut.standard.wrapProxy(
            prop, null, 0,
            function() { return { dest: { foo: 'notafunc' } }; },
            method
        )();
    }
    catch ( e )
    {
        proxyErrorAssertCommon( e, prop, method );
        return;
    }

    assert.fail(
        "Error should be thrown if proxy would fail due to a non-function"
    );
} )();


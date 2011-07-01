/**
 * Tests method builder
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

var common    = require( './common' ),
    assert    = require( 'assert' ),
    mb_common = require( __dirname + '/inc-member_builder-common' ),
    builder   = common.require( 'member_builder' ),
    util      = common.require( 'util' )
;

mb_common.funcVal     = 'foobar';
mb_common.value       = function() { return mb_common.funcVal; };
mb_common.buildMember = builder.buildMethod;

// do assertions common to all member builders
mb_common.assertCommon();


/**
 * One may question the purpose of this assertion. Why should we not permit
 * overriding properties with methods? It's useful to be able to store callbacks
 * and such within properties.
 *
 * Yes, it is. However, that would be misinterpreting the purpose of the method
 * builder. Here, we are working with prototypes, not class instances. If the
 * user wishes to assign a function to the property (so long as it's permitted
 * by the type definition) after the class is instantiated, he/she may go right
 * ahead. However, if we modify the prototype to use a function, then the
 * prototype will interpret the function as a method. As such, the method cannot
 * be overridden with a property in the future. To avoid this confusing
 * scenario, we'll prevent it from occurring entirely.
 */
( function testCannotOverridePropertyWithMethod()
{
    mb_common.value   = 'moofoo';
    mb_common.funcVal = undefined;
    mb_common.buildMemberQuick();

    assert.throws( function()
    {
        // attempt to override with function
        mb_common.value = function() {};
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Cannot override property with method" );
} )();


/**
 * Unlike Java, PHP, Python and similar languages, methods in ease.js are *not*
 * virtual by default. In order to make them override-able, the 'virtual'
 * keyword must be specified for that method in the supertype.
 *
 * Therefore, let's ensure that non-virtual methods cannot be overridden.
 */
( function testCannotOverrideNonVirtualMethod()
{
    mb_common.value = function() {};
    mb_common.buildMemberQuick();

    try
    {
        // attempt to override (should throw exception; non-virtual)
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        // ensure we have the correct error
        assert.ok(
            e.message.search( 'virtual' ) !== -1,
            "Error message for non-virtual override should mention virtual"
        );

        assert.ok(
            e.message.search( mb_common.name ) !== -1,
            "Method name should be provided in non-virtual error message"
        );

        return;
    }

    assert.fail( "Should not be permitted to override non-virtual methods" );
} )();


/**
 * Working off of what was said in the test directly above, we *should* be able
 * to override virtual methods.
 */
( function testCanOverrideVirtualMethods()
{
    // build a virtual method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    // attempt to override it
    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( {}, true );
    }, Error, "Should be able to override virtual methods" );
} )();


/**
 * Unlike languages like C++, ease.js does not automatically mark overridden
 * methods as virtual. C# and some other languages offer a 'seal' keyword or
 * similar in order to make overridden methods non-virtual. In that sense,
 * ease.js will "seal" overrides by default.
 */
( function testOverriddenMethodsAreNotVirtualByDefault()
{
    // build a virtual method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    // override it (non-virtual)
    mb_common.buildMemberQuick( {}, true );

    // attempt to override again (should fail)
    assert.throws( function()
    {
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Overrides are not declared as virtual by default" );
} )();


/**
 * Given the test directly above, we can therefore assume that it should be
 * permitted to declare overridden methods as virtual.
 */
( function testCanDeclareOverridesAsVirtual()
{
    // build a virtual method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    // override it (virtual)
    mb_common.buildMemberQuick( { 'virtual': true }, true );

    // attempt to override again
    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( {}, true );
    }, Error, "Can override an override if declared virtual" );
} )();


/**
 * Abstract members exist to be overridden. As such, they should be considered
 * virtual.
 */
( function testAbstractMethodsAreConsideredVirtual()
{
    // build abstract method
    mb_common.value = function() {};
    mb_common.buildMemberQuick( { 'abstract': true } );

    // we should be able to override it
    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( {}, true );
    }, Error, "Can overrde abstract methods" );
} )();


/**
 * Static methods cannot realistically be declared as virtual; it doesn't make
 * sense. Virtual implies that the method may be overridden, but static methods
 * cannot be overridden. Only hidden.
 */
( function testCannotDeclareStaticMethodsAsVirtual()
{
    mb_common.value = function() {};

    try
    {
        // attempt to build a virtual static method (should throw exception)
        mb_common.buildMemberQuick( { 'static': true, 'virtual': true } );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( mb_common.name ) !== -1,
            "Method name should be provided in virtual static error message"
        );

        return;
    }

    assert.fail( "Should not be permitted to declare a virtual static method" );
} )();


/**
 * To ensure interfaces of subtypes remain compatible with that of their
 * supertypes, the parameter lists must match and build upon each other.
 */
( function testMethodOverridesMustHaveEqualOrGreaterParameters()
{
    mb_common.value = function( one, two ) {};
    mb_common.buildMemberQuick( { 'virtual': true } );

    assert.doesNotThrow( function()
    {
        mb_common.buildMemberQuick( { 'virtual': true }, true );
    }, TypeError, "Method can have equal number of parameters" );

    assert.doesNotThrow( function()
    {
        mb_common.value = function( one, two, three ) {};
        mb_common.buildMemberQuick( { 'virtual': true }, true );
    }, TypeError, "Method can have greater number of parameters" );

    assert.throws( function()
    {
        mb_common.value = function( one ) {};
        mb_common.buildMemberQuick( {}, true );
    }, TypeError, "Method cannot have lesser number of parameters" );
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
    var orig_called = false;

    // "super" method
    mb_common.value = function()
    {
        orig_called = true;
    };

    mb_common.buildMemberQuick( { 'virtual': true } );

    // override method
    mb_common.value = function()
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
    };

    mb_common.buildMemberQuick( {}, true );

    // invoke the method
    mb_common.members[ 'public' ][ mb_common.name ]();
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
    var members      = builder.initMembers(),
        super_called = false,
        retobj       = {},
        instCallback = function()
        {
            return retobj;
        },

        // the overriding method
        newfunc = function()
        {
            this.__super();
        }
    ;

    // super method to be overridden
    members[ 'public' ].foo = function()
    {
        super_called = true;
    };

    // XXX: Bad idea. Set the keyword in another manner. This is likely to break
    // in the future.
    members['public'].foo.___$$keywords$$ = { 'virtual': true };

    // override
    builder.buildMethod( members, {}, 'foo', newfunc, {}, instCallback );

    // call the overriding method
    members[ 'public' ].foo();

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
 * Once a concrete implementation has been defined for a method, a subtype
 * cannot make it abstract.
 */
( function testCannotOverrideConcreteMethodWithAbstractMethod()
{
    // concrete method
    mb_common.value = function() {};
    mb_common.buildMemberQuick();

    assert.throws( function()
    {
        mb_common.buildMemberQuick( { 'abstract': true }, true );
    }, TypeError, "Cannot override concrete method with abstract method" );
} )();


/**
 * One of the powerful features of the method builder is the ability to pass in
 * an instance to be bound to 'this' when invoking a method. This has some
 * important consequences, such as the ability to implement protected/private
 * members.
 */
( function testMethodInvocationBindsThisToPassedInstance()
{
    var instance = function() {},
        val      = 'fooboo',
        val2     = 'fooboo2',
        iid      = 1,

        func = function()
        {
            return this.foo;
        },

        func2 = function()
        {
            return this.foo2;
        },

        called       = false,
        instCallback = function()
        {
            called = true;
            return instance;
        },

        members = builder.initMembers()
    ;

    // set instance values
    instance.foo  = val;
    instance.foo2 = val2;

    // concrete method
    mb_common.buildMember(
        members,
        exports.meta,
        'func',
        func,
        { 'virtual': true },
        instCallback
    );

    assert.equal(
        members[ 'public' ].func(),
        val,
        "Calling method will bind 'this' to passed instance"
    );

    // override method
    mb_common.buildMember(
        members,
        exports.meta,
        'func',
        func2,
        {},
        instCallback
    );

    assert.equal(
        members[ 'public' ].func(),
        val2,
        "Calling method override will bind 'this' to passed instance"
    );
} )();


/**
 * It does not make sense to be able to declare abstract private methods, since
 * they cannot be inherited and overridden by subtypes.
 */
( function testCannotDeclareAbstractPrivateMethods()
{
    mb_common.value = function() {};

    assert.throws( function()
    {
        mb_common.buildMemberQuick( { 'private': true, 'abstract': true } );
    }, TypeError, "Cannot declare private abstract method" );
} )();


/**
 * While getters are technically methods, it doesn't make sense to override
 * getters/setters with methods because they are fundamentally different.
 */
( function testCannotOverrideGetters()
{
    if ( util.definePropertyFallback() )
    {
        return;
    }

    mb_common.members[ 'public' ] = {};
    Object.defineProperty( mb_common.members[ 'public' ], mb_common.name, {
        get: function() {},
    } );

    try
    {
        mb_common.value = function() {};
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( mb_common.name ) !== -1,
            "Method override getter failure should contain method name"
        );

        // ensure we have the correct error
        assert.ok( e.message.search( 'getter' ) !== -1,
            "Proper error is thrown for getter override failure"
        );

        return;
    }

    assert.fail(
        "Should not be permitted to override getters with methods"
    );
} )();


/**
 * While setters are technically methods, it doesn't make sense to override
 * getters/setters with methods because they are fundamentally different.
 */
( function testCannotOverrideSetters()
{
    if ( util.definePropertyFallback() )
    {
        return;
    }

    mb_common.members[ 'public' ] = {};
    Object.defineProperty( mb_common.members[ 'public' ], mb_common.name, {
        set: function() {},
    } );

    try
    {
        mb_common.value = function() {};
        mb_common.buildMemberQuick( {}, true );
    }
    catch ( e )
    {
        assert.ok( e.message.search( mb_common.name ) !== -1,
            "Method override setter failure should contain method name"
        );

        // ensure we have the correct error
        assert.ok( e.message.search( 'setter' ) !== -1,
            "Proper error is thrown for setter override failure"
        );

        return;
    }

    assert.fail(
        "Should not be permitted to override setters with methods"
    );
} )();


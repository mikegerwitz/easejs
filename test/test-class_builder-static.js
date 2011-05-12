/**
 * Tests static members (this includes constants)
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
    builder   = common.require( 'class_builder' ),
    fallback  = common.require( 'util' ).definePropertyFallback()
;


/**
 * To provide access to static members, this.__self is made available inside of
 * instances.
 */
( function testSelfPropertyReferencesClassDefinition()
{
    var val = [ 'baz' ],
        Foo = builder.build(
        {
            'public function test': function()
            {
                return this.__self;
            },
        } );

    Foo.bar = val;

    // we must use instanceof here because the __self object has the class in
    // its prototype chain
    assert.ok( ( Foo().test().bar === Foo.bar ),
        "__self property references class definition"
    );
} )();


/**
 * If a static property does not exist, the getter should return undefined.
 *
 * This test exists to ensure an error is not thrown if the property is not
 * found. This is because we check each parent and eventually reach the base
 * object. We must ensure the base object does not cause any problems.
 */
( function testStaticPropertyLookupReturnsUndefinedIfNotFound()
{
    var result = builder.build( {} ).$( 'foo' );

    assert.equal( result, undefined,
        "Static property getter should return undefined if not found"
    );
} )();


/**
 * If supported by the environment, ensure that the accessor method used to
 * access static properties is not enumerable. It's unnecessary clutter (and
 * confusion) otherwise.
 */
( function testStaticPropertyAccessorIsNotEnumerable()
{
    var get = Object.getOwnPropertyDescriptor,
        Foo = builder.build( {} );

    // don't perform the test if unsupported
    if ( fallback )
    {
        return;
    }

    assert.equal( get( Foo, '$' ).enumerable, false,
        "Static property accessor method should not be enumerable"
    );
} )();


/**
 * Static members, by their nature, should be accessible through the class
 * definition itself; that is, without instantiation. It should also not be
 * available through the generated prototype (and therefore, be unavailable to
 * instances).
 */
( function testPublicStaticMembersAreAccessibleViaClassDefinitionOnly()
{
    var val  = 'foo',
        val2 = 'bar',
        Foo  = builder.build(
        {
            'public static foo': val,

            // should be public by default
            'static bar': val2,

            // the same rules should apply to methods
            'public static baz': function()
            {
                return val;
            },

            'static foobar': function()
            {
                return val2;
            },
        } );

    // properties should be accessible via class definition
    assert.equal( Foo.$('foo'), val,
        "Public static properties should be accessible via class definition"
    );

    // as long as the above test succeeded, we can then conclude that static
    // members are public by default if the following succeeds
    assert.equal( Foo.$('bar'), val2,
        "Static properties are public by default"
    );

    // methods should be accessible via class definition
    assert.equal( Foo.baz(), val,
        "Public static methods should be accessible via class definition"
    );

    // same rules as above, but with a method
    assert.equal( Foo.foobar(), val2,
        "Static methods are public by default"
    );

    // getter/setter method should not be a part of the prototype
    assert.equal( Foo.prototype.$, undefined,
        "Public static properties are *not* part of the prototype"
    );
} )();


/**
 * Same as above, but with getters/setters. We can only run this test if
 * getters/setters are supported by the engine running it.
 */
( function testPublicStaticGettersSettersAreAccessibleViaClassDefinitionOnly()
{
    // if unsupported, don't bother with the test
    if ( fallback )
    {
        return;
    }

    // we must define in this manner so older engines won't blow up due to
    // syntax errors
    var def    = {},
        val    = 'baz'
        called = [];

    Object.defineProperty( def, 'public static foo', {
        get: function() { return val; },
        set: function() { called[ 0 ] = true; },

        enumerable: true,
    } );

    // should be public by default if not specified
    Object.defineProperty( def, 'static bar', {
        get: function() { return val; },
        set: function() { called[ 1 ] = true; },

        enumerable: true,
    } );

    // define the class
    var Foo = builder.build( def );

    assert.equal( Foo.foo, val,
        "Public static getters are accessible via class definition"
    );

    Foo.foo = 'moo';
    assert.equal( called[ 0 ], true,
        "Public static setters are accessible via class definition"
    );

    assert.equal( Foo.bar, val,
        "Static getters are public by default"
    );

    Foo.bar = 'moo';
    assert.equal( called[ 1 ], true,
        "Static setters are public by default"
    );

    // none of these should be available on the prototype
    assert.equal( Foo.prototype.foo, undefined,
        "Public static getters/getters are unavailable on prototype (0)"
    );
    assert.equal( Foo.prototype.bar, undefined,
        "Public static getters/getters are unavailable on prototype (1)"
    );
} )();


/**
 * With non-static methods, 'this' is bound to the instance. In the case of
 * static members, we should bind to the class definition (equivalent of
 * this.__self).
 *
 * This functionality had already existed previously. When a propobj is not
 * available for an instance, it falls back. This serves as a regression test to
 * ensure this functionality remains.
 */
( function testStaticMethodsNotBoundToInstance()
{
    var result = null,
        Foo    = builder.build(
        {
            'public static foo': function()
            {
                result = this;
            },
        } );

    // call the static method
    Foo.foo();

    assert.notEqual( result, Foo,
        "Static members are bound to class definition rather than instance"
    );
} )();


/**
 * We don't have the benefit of static members being part of the prototype
 * chain. Inheritance is not automatic. This test deals only with ensuring that
 * *public* static members are inherited by subtypes.
 */
( function testPublicStaticMembersAreInheritedBySubtypes()
{
    var def = {
        'public static foo': 'val',
        'public static func': function() {},

        'public bla': 'moo',
    };

    // also test getters/setters if supported
    if ( !fallback )
    {
        Object.defineProperty( def, 'public static bar', {
            get: function() {},
            set: function() {},

            enumerable: true,
        } );
    }

    var baz = 'foobar',
        Foo = builder.build( def ),

        // extends from the parent and adds an additional
        SubFoo = builder.build( Foo, { 'public static baz': baz } ),

        // simply extends from the parent (also serves as a check to ensure that
        // static members of *all* parents are inherited, not just the
        // immediate)
        SubSubFoo = builder.build( SubFoo, {} )
    ;

    // properties
    assert.equal( SubFoo.$('foo'), Foo.$('foo'),
        "Public static properties are inherited by subtypes"
    );
    assert.equal( SubSubFoo.$('foo'), Foo.$('foo'),
        "Public static properties are inherited by sub-subtypes"
    );

    // methods
    assert.deepEqual( SubFoo.func, Foo.func,
        "Public static methods are inherited by subtypes"
    );
    assert.deepEqual( SubSubFoo.func, Foo.func,
        "Public static methods are inherited by sub-subtypes"
    );

    // merge
    assert.equal( SubFoo.$('baz'), baz,
        "Subtypes contain both inherited static members as well as their own"
    );

    // getters/setters (if supported by engine)
    if ( !fallback )
    {
        var super_data   = Object.getOwnPropertyDescriptor( Foo, 'bar' ),
            sub_data     = Object.getOwnPropertyDescriptor( SubFoo, 'bar' ),
            sub_sub_data = Object.getOwnPropertyDescriptor( SubFoo, 'bar' )
        ;

        // getters
        assert.deepEqual( super_data.get, sub_data.get,
            "Public static getters are inherited by subtypes"
        );
        assert.deepEqual( super_data.get, sub_sub_data.get,
            "Public static getters are inherited by sub-subtypes"
        );

        // setters
        assert.deepEqual( super_data.set, sub_data.set,
            "Public static setters are inherited by subtypes"
        );
        assert.deepEqual( super_data.set, sub_sub_data.set,
            "Public static setters are inherited by sub-subtypes"
        );
    }
} )();


/**
 * Static references should be inherited by subtypes. That is, modifying a
 * static property of a supertype should modify the same static property of the
 * subtype, so long as the subtype has not defined a property of the same name.
 */
( function testPublicStaticPropertyReferencesAreInheritedBySubtypes()
{
    var val  = [ 1, 2, 3 ],
        val2 = [ 'a', 'b', 'c' ],

        Foo = builder.build(
        {
            'public static bar': val,
        } ),
        SubFoo = builder.build( Foo, {} )
    ;

    // the properties should reference the same object
    assert.ok( SubFoo.$('bar') === Foo.$('bar'),
        "Inherited static properties should share references"
    );

    // setting a property on Foo should set the property on SubFoo and
    // vice-versa
    Foo.$( 'bar', val2 );
    assert.deepEqual( Foo.$( 'bar' ), val2,
        "Can set static property values"
    );

    assert.ok( Foo.$( 'bar' ) === SubFoo.$( 'bar' ),
        "Setting a static property value on a supertype also sets the value " +
            "on subtypes"
    );

    SubFoo.$( 'bar', val );
    assert.ok( Foo.$( 'bar' ) === SubFoo.$( 'bar' ) );
} )();


/**
 * Static members do not have the benefit of prototype chains. We must
 * implement our own means of traversing the inheritance tree. This is done by
 * checking to see if a class has defined the requested property, then
 * forwarding the call to the parent if it has not.
 *
 * The process of looking up the property is very important. hasOwnProperty is
 * used rather than checking for undefined, because they have drastically
 * different results. Setting a value to undefined (if hasOwnProperty were not
 * used) would effectively forward all requests to the base class (since no
 * property would be found), thereby preventing it from ever being written to
 * again.
 */
( function testSettingsStaticPropertiesToUndefinedWillNotCorruptLookupProcess()
{
    var val = 'baz',
        Foo = builder.build(
        {
            'public static foo': '',
        } )
    ;

    // first check to ensure we can set the value to null
    Foo.$( 'foo', null );
    assert.strictEqual( Foo.$( 'foo' ), null,
        "Static properties may be set to null"
    );

    // then undefined (this actually won't do anything)
    Foo.$( 'foo', undefined );
    assert.strictEqual( Foo.$( 'foo' ), undefined,
        "Static properties may be set to undefined"
    );

    // then set back to a scalar
    Foo.$( 'foo', val );
    assert.equal( Foo.$( 'foo' ), val,
        "Setting static property to undefined does not corrupt lookup process"
    );
} )();


/**
 * Ensure that the proper context is returned by static property setters. It
 * should return the calling class, regardless of whether or not it owns the
 * property being requested.
 */
( function testStaticPropertySettersReturnProperContext()
{
    var Foo = builder.build(
        {
            'public static foo': '',
        } ),

        SubFoo = builder.build( Foo, {} )
    ;

    assert.ok( Foo.$( 'foo', 'val' ) === Foo,
        "Static property setter returns self"
    );

    assert.ok( SubFoo.$( 'foo', 'val' ) === SubFoo,
        "Static property setter returns calling class, even if property is " +
            "owned by a supertype"
    );
} )();


/**
 * Users should not be permitted to set values of static properties that have
 * not been declared.
 */
( function testAttemptingToSetUndeclaredStaticPropertyResultsInException()
{
    assert.throws(
        function()
        {
            // should throw an exception since property 'foo' has not been
            // declared
            builder.build( {} ).$( 'foo', 'val' );
        },
        ReferenceError,
        "Attempting to set an undeclaraed static property results in an " +
            "exception"
    );
} )();


/**
 * Protected members should be available from within the class but shouldn't be
 * exposed to the world
 */
( function testProtectedStaticMembersAreAvailableInsideClassOnly()
{
    var val = 'foo',
        Foo = builder.build(
        {
            // the same rules should apply to methods
            'protected static baz': function()
            {
                return val;
            },

            // ensure method is accessible to static methods
            'public static staticBaz': function()
            {
                return this.baz();
            },

            // ensure method is accessible to instance methods
            'public instBaz': function()
            {
                return this.__self.baz();
            },
        } );

    assert.equal( Foo.baz, undefined,
        "Protected methods should not be accessible outside the class"
    );

    assert.equal( Foo.staticBaz(), val,
        "Protected methods are accessible to static methods"
    );

    assert.equal( Foo().instBaz(), val,
        "Protected methods are accessible to instance methods"
    );
} )();


/**
 * As usual, protected members (in this case, static) should be inherited by
 * subtypes.
 */
( function testProtectedStaticMembersAreInheritedBySubtypes()
{
    var val  = 'baz',
        val2 = 'bazbaz',
        Foo  = builder.build(
        {
            'protected static foo': function()
            {
                return val;
            },
        } ),

        SubFoo = builder.build( Foo,
        {
            'public static bar': function()
            {
                return this.foo();
            },

            'protected static foo2': function()
            {
                return val2;
            },

            'public static bar2': function()
            {
                return this.foo2();
            },
        } ),

        SubSubFoo = builder.build( SubFoo, {} )
    ;

    assert.equal( SubFoo.bar(), val,
        "Subtypes inherit parents' protected static methods"
    );

    assert.equal( SubFoo.bar2(), val2,
        "Static methods have access to other static methods in the same class"
    );

    // for extra assurance, to ensure our recursive implementation is correct
    assert.equal( SubSubFoo.bar(), val,
        "Sub-subtypes inherit parents' protected static methods"
    );
} )();


/**
 * Private members should be available from within the class, but not outside of
 * it
 */
( function testPrivateStaticMembersAreAvailableInsideClassOnly()
{
    var val = 'foo',
        Foo = builder.build(
        {
            // the same rules should apply to methods
            'private static baz': function()
            {
                return val;
            },

            // ensure method is accessible to static methods
            'public static staticBaz': function()
            {
                return this.baz();
            },

            // ensure method is accessible to instance methods
            'public instBaz': function()
            {
                return this.__self.baz();
            },
        } );

    assert.equal( Foo.baz, undefined,
        "Private methods should not be accessible outside the class"
    );

    assert.equal( Foo.staticBaz(), val,
        "Private methods are accessible to static methods"
    );

    assert.equal( Foo().instBaz(), val,
        "Private methods are accessible to instance methods"
    );
} )();


/**
 * Private static members should not be inherited by subtypes. Of course. Moving
 * along...
 */
( function testPrivateStaticMembersAreNotInheritedBySubtypes()
{
    var Foo = builder.build(
        {
            'private static priv': function() {},
        } ),

        SubFoo = builder.build( Foo,
        {
            'public static getPriv': function()
            {
                return this.priv;
            },
        } )
    ;

    assert.equal( SubFoo.getPriv(), undefined,
        "Private static methods should not be inherited by subtypes"
    );
} )();


/**
 * Public and protected static methods should be able to be overridden by
 * subtypes. We needn't test private methods, as they are not inherited.
 */
( function testStaticMethodsCanBeOverriddenBySubtypes()
{
    var val = 'bar',
        Foo = builder.build(
        {
            'public static foo': function() {},
            'protected static bar': function() {},
        } ),

        SubFoo = builder.build( Foo,
        {
            'public static foo': function()
            {
                return val;
            },

            'public static prot': function()
            {
                return this.bar();
            },

            'protected static bar': function()
            {
                return val;
            },
        } );

    assert.equal( SubFoo.foo(), val,
        "Public static methods can be overridden by subtypes"
    );

    assert.equal( SubFoo.prot(), val,
        "Protected static methods can be overridden by subtypes"
    );
} )();


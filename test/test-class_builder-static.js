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
    var Foo = builder.build(
    {
        'public function test': function()
        {
            return this.__self;
        },
    } );

    assert.deepEqual( Foo().test(), Foo,
        "__self property references class definition"
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
    assert.equal( Foo.foo, val,
        "Public static properties should be accessible via class definition"
    );

    // as long as the above test succeeded, we can then conclude that static
    // members are public by default if the following succeeds
    assert.equal( Foo.bar, val2,
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

    // neither should be a part of the prototype
    assert.equal( Foo.prototype.foo, undefined,
        "Public static properties are *not* part of the prototype"
    );
    assert.equal( Foo.prototype.baz, undefined,
        "Public static methods are *not* part of the prototype"
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
( function testStaticMethodsBoundToClassRatherThanInstance()
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

    assert.deepEqual( result, Foo,
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
    assert.equal( SubFoo.foo, Foo.foo,
        "Public static properties are inherited by subtypes"
    );
    assert.equal( SubSubFoo.foo, Foo.foo,
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
    assert.equal( SubFoo.baz, baz,
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
 * Each class should have its own set of static values. That is, a subtype
 * should not share references with its parent.
 */
( function testInheritedPublicStaticPropertiesAreClones()
{
    var val = [ 1, 2, 3 ],
        Foo = builder.build(
        {
            'public static bar': val,
        } ),
        SubFoo = builder.build( Foo, {} )
    ;

    // the values should certainly be equal...
    assert.deepEqual( SubFoo.bar, Foo.bar,
        "Inherited static properties should be equal by value"
    );

    // ...but they should not be the same object
    assert.ok( SubFoo.bar !== Foo.bar,
        "Inherited static propertis should not be the same object"
    );
} )();


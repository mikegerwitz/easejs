/**
 * Tests static members
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
        this.fallback = this.require( 'util' ).definePropertyFallback();

        this.ClassBuilder         = this.require( 'ClassBuilder' );
        this.MemberBuilder        = this.require( 'MemberBuilder' );
        this.MethodWrapperFactory = this.require( 'MethodWrapperFactory' );

        this.wrappers = this.require( 'MethodWrappers' ).standard;
    },


    setUp: function()
    {
        // XXX: get rid of this disgusting mess; we're mid-refactor and all
        // these dependencies should not be necessary for testing
        this.builder = this.ClassBuilder(
            this.require( 'warn' ).DismissiveHandler(),
            this.MemberBuilder(
                this.MethodWrapperFactory( this.wrappers.wrapNew ),
                this.MethodWrapperFactory( this.wrappers.wrapOverride ),
                this.MethodWrapperFactory( this.wrappers.wrapProxy ),
                this.getMock( 'MemberBuilderValidator' )
            ),
            this.require( 'VisibilityObjectFactoryFactory' )
                .fromEnvironment()
        );
    },


    /**
     * To provide access to static members, this.__self is made available inside
     * of instances.
     */
    'Self property references class definition': function()
    {
        var val = [ 'baz' ],
            Foo = this.builder.build(
            {
                'public test': function()
                {
                    return this.__self;
                },
            } );

        Foo.bar = val;

        // we must use instanceof here because the __self object has the class
        // in its prototype chain
        this.assertOk( ( Foo().test().bar === Foo.bar ),
            "__self property references class definition"
        );
    },


    /**
     * If a static property does not exist, the getter should return undefined.
     *
     * This test exists to ensure an error is not thrown if the property is not
     * found. This is because we check each parent and eventually reach the base
     * object. We must ensure the base object does not cause any problems.
     */
    'Static property lookup returns undefined if not found': function()
    {
        var result = this.builder.build( {} ).$( 'foo' );

        this.assertEqual( result, undefined,
            "Static property getter should return undefined if not found"
        );
    },


    /**
     * If supported by the environment, ensure that the accessor method used to
     * access static properties is not enumerable. It's unnecessary clutter (and
     * confusion) otherwise.
     */
    'Static property accessor is not enumerable': function()
    {
        var get = Object.getOwnPropertyDescriptor,
            Foo = this.builder.build( {} );

        // don't perform the test if unsupported
        if ( this.fallback )
        {
            return;
        }

        this.assertEqual( get( Foo, '$' ).enumerable, false,
            "Static property accessor method should not be enumerable"
        );
    },


    /**
     * Static members, by their nature, should be accessible through the class
     * definition itself; that is, without instantiation. It should also not be
     * available through the generated prototype (and therefore, be unavailable
     * to instances).
     */
    'Public static members are accessible via class definition only': function()
    {
        var val  = 'foo',
            val2 = 'bar',
            Foo  = this.builder.build(
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
        this.assertEqual( Foo.$('foo'), val,
            "Public static properties should be accessible via class definition"
        );

        // as long as the above test succeeded, we can then conclude that static
        // members are public by default if the following succeeds
        this.assertEqual( Foo.$('bar'), val2,
            "Static properties are public by default"
        );

        // methods should be accessible via class definition
        this.assertEqual( Foo.baz(), val,
            "Public static methods should be accessible via class definition"
        );

        // same rules as above, but with a method
        this.assertEqual( Foo.foobar(), val2,
            "Static methods are public by default"
        );

        // getter/setter method should not be a part of the prototype
        this.assertEqual( Foo.prototype.$, undefined,
            "Public static properties are *not* part of the prototype"
        );
    },


    /**
     * Same as above, but with getters/setters. We can only run this test if
     * getters/setters are supported by the engine running it.
     */
    'Public static getters/setter accessible via class dfn only': function()
    {
        // if unsupported, don't bother with the test
        if ( this.fallback )
        {
            return;
        }

        // we must define in this manner so older engines won't blow up due to
        // syntax errors
        var def    = {},
            val    = 'baz',
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
        var Foo = this.builder.build( def );

        this.assertEqual( Foo.foo, val,
            "Public static getters are accessible via class definition"
        );

        Foo.foo = 'moo';
        this.assertEqual( called[ 0 ], true,
            "Public static setters are accessible via class definition"
        );

        this.assertEqual( Foo.bar, val,
            "Static getters are public by default"
        );

        Foo.bar = 'moo';
        this.assertEqual( called[ 1 ], true,
            "Static setters are public by default"
        );

        // none of these should be available on the prototype
        this.assertEqual( Foo.prototype.foo, undefined,
            "Public static getters/getters are unavailable on prototype (0)"
        );
        this.assertEqual( Foo.prototype.bar, undefined,
            "Public static getters/getters are unavailable on prototype (1)"
        );
    },


    /**
     * With non-static methods, 'this' is bound to the instance. In the case of
     * static members, we should bind to the class definition (equivalent of
     * this.__self).
     *
     * This functionality had already existed previously. When a propobj is not
     * available for an instance, it falls back. This serves as a regression
     * test to ensure this functionality remains.
     */
    'Static methods not bound to instance': function()
    {
        var result = null,
            Foo    = this.builder.build(
            {
                'public static foo': function()
                {
                    result = this;
                },
            } );

        // call the static method
        Foo.foo();

        // note that the objects themselves aren't the same, due to the property
        // object
        this.assertEqual( result.foo, Foo.foo,
            "Static members are bound to class definition rather than instance"
        );
    },


    /**
     * We don't have the benefit of static members being part of the prototype
     * chain. Inheritance is not automatic. This test deals only with ensuring
     * that *public* static members are inherited by subtypes.
     */
    'Public static members are inherited by subtypes': function()
    {
        var def = {
            'public static foo': 'val',
            'public static func': function() {},

            'public bla': 'moo',
        };

        // also test getters/setters if supported
        if ( !this.fallback )
        {
            Object.defineProperty( def, 'public static bar', {
                get: function() {},
                set: function() {},

                enumerable: true,
            } );
        }

        var baz = 'foobar',
            Foo = this.builder.build( def ),

            // extends from the parent and adds an additional
            SubFoo = this.builder.build( Foo, { 'public static baz': baz } ),

            // simply extends from the parent (also serves as a check to ensure
            // that static members of *all* parents are inherited, not just the
            // immediate)
            SubSubFoo = this.builder.build( SubFoo, {} )
        ;

        // properties
        this.assertEqual( SubFoo.$('foo'), Foo.$('foo'),
            "Public static properties are inherited by subtypes"
        );
        this.assertEqual( SubSubFoo.$('foo'), Foo.$('foo'),
            "Public static properties are inherited by sub-subtypes"
        );

        // methods
        this.assertDeepEqual( SubFoo.func, Foo.func,
            "Public static methods are inherited by subtypes"
        );
        this.assertDeepEqual( SubSubFoo.func, Foo.func,
            "Public static methods are inherited by sub-subtypes"
        );

        // merge
        this.assertEqual( SubFoo.$('baz'), baz,
            "Subtypes contain both inherited static members as well as their " +
            "own"
        );

        // getters/setters (if supported by engine)
        if ( !this.fallback )
        {
            var super_data   = Object.getOwnPropertyDescriptor( Foo, 'bar' ),
                sub_data     = Object.getOwnPropertyDescriptor( SubFoo, 'bar' ),
                sub_sub_data = Object.getOwnPropertyDescriptor(
                    SubSubFoo, 'bar'
                )
            ;

            // getters
            this.assertDeepEqual( super_data.get, sub_data.get,
                "Public static getters are inherited by subtypes"
            );
            this.assertDeepEqual( super_data.get, sub_sub_data.get,
                "Public static getters are inherited by sub-subtypes"
            );

            // setters
            this.assertDeepEqual( super_data.set, sub_data.set,
                "Public static setters are inherited by subtypes"
            );
            this.assertDeepEqual( super_data.set, sub_sub_data.set,
                "Public static setters are inherited by sub-subtypes"
            );
        }
    },


    /**
     * Static references should be inherited by subtypes. That is, modifying a
     * static property of a supertype should modify the same static property of
     * the subtype, so long as the subtype has not defined a property of the
     * same name.
     */
    'Public static property references are inherited by subtypes': function()
    {
        var val  = [ 1, 2, 3 ],
            val2 = [ 'a', 'b', 'c' ],

            Foo = this.builder.build(
            {
                'public static bar': val,
            } ),
            SubFoo = this.builder.build( Foo, {} )
        ;

        // the properties should reference the same object
        this.assertOk( SubFoo.$('bar') === Foo.$('bar'),
            "Inherited static properties should share references"
        );

        // setting a property on Foo should set the property on SubFoo and
        // vice-versa
        Foo.$( 'bar', val2 );
        this.assertDeepEqual( Foo.$( 'bar' ), val2,
            "Can set static property values"
        );

        this.assertOk( Foo.$( 'bar' ) === SubFoo.$( 'bar' ),
            "Setting a static property value on a supertype also sets the " +
                "value on subtypes"
        );

        SubFoo.$( 'bar', val );
        this.assertOk( Foo.$( 'bar' ) === SubFoo.$( 'bar' ) );
    },


    /**
     * Static members do not have the benefit of prototype chains. We must
     * implement our own means of traversing the inheritance tree. This is done
     * by checking to see if a class has defined the requested property, then
     * forwarding the call to the parent if it has not.
     *
     * The process of looking up the property is very important. hasOwnProperty
     * is used rather than checking for undefined, because they have drastically
     * different results. Setting a value to undefined (if hasOwnProperty were
     * not used) would effectively forward all requests to the base class (since
     * no property would be found), thereby preventing it from ever being
     * written to again.
     */
    'Setting static props to undefined will not corrupt lookup': function()
    {
        var val = 'baz',
            Foo = this.builder.build(
            {
                'public static foo': '',
            } )
        ;

        // first check to ensure we can set the value to null
        Foo.$( 'foo', null );
        this.assertStrictEqual( Foo.$( 'foo' ), null,
            "Static properties may be set to null"
        );

        // then undefined (this actually won't do anything)
        Foo.$( 'foo', undefined );
        this.assertStrictEqual( Foo.$( 'foo' ), undefined,
            "Static properties may be set to undefined"
        );

        // then set back to a scalar
        Foo.$( 'foo', val );
        this.assertEqual( Foo.$( 'foo' ), val,
            "Setting static property to undefined does not corrupt lookup " +
            "process"
        );
    },


    /**
     * Ensure that the proper context is returned by static property setters. It
     * should return the calling class, regardless of whether or not it owns the
     * property being requested.
     */
    'Static property setters return proper context': function()
    {
        var Foo = this.builder.build(
            {
                'public static foo': '',
            } ),

            SubFoo = this.builder.build( Foo, {} )
        ;

        this.assertOk( Foo.$( 'foo', 'val' ) === Foo,
            "Static property setter returns self"
        );

        this.assertOk( SubFoo.$( 'foo', 'val' ) === SubFoo,
            "Static property setter returns calling class, even if property " +
            "is owned by a supertype"
        );
    },


    /**
     * Users should not be permitted to set values of static properties that
     * have not been declared.
     */
    'Attempting to set undeclared static prop results in exception': function()
    {
        var _self = this;

        this.assertThrows(
            function()
            {
                // should throw an exception since property 'foo' has not been
                // declared
                _self.builder.build( {} ).$( 'foo', 'val' );
            },
            ReferenceError,
            "Attempting to set an undeclaraed static property results in an " +
                "exception"
        );
    },


    /**
     * Same as above test. In this case, we have to keep in mind that non-class
     * bases may not have the static accessor method defined. In that case,
     * attempting to call it would cause an error.
     *
     * Of course, even if they did have a static accessor method defined, we
     * wouldn't want to use it, as it isn't the one provided by us. Let's close
     * up as many holes in the framework as we can. It's more to prevent
     * unintended side-effects than anything. There's not much one could do with
     * a "fake" static accessor method that they couldn't with a base class. So,
     * for good measure, we'll declare one on our test base.
     */
    'Accessing static accessor method on non-class base also works': function()
    {
        var _self = this,
            base  = function() {},
            Test  = _self.builder.build( base, {} )
        ;

        // we do not want to call this
        base.$ = function()
        {
            _self.fail(
                "Should not call static accessor method of non-class base"
            );
        };

        // get
        this.assertEqual( undefined, Test.$( 'foo' ) );

        // set
        this.assertThrows(
            function()
            {
                Test.$( 'foo', 'val' );
            },
            ReferenceError,
            "Attempting to set an undeclaraed static property results in an " +
                "exception on non-class base"
        );
    },


    /**
     * Protected members should be available from within the class but shouldn't
     * be exposed to the world
     */
    'Protected static members are available inside class only': function()
    {
        var val = 'foo',
            Foo = this.builder.build(
            {
                'protected static prop': val,


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

                'public static staticGetProp': function()
                {
                    return this.$('prop');
                },

                'public instGetProp': function()
                {
                    return this.__self.$('prop');
                },
            } );

        this.assertEqual( Foo.baz, undefined,
            "Protected methods should not be accessible outside the class"
        );

        this.assertEqual( Foo.staticBaz(), val,
            "Protected methods are accessible to static methods"
        );

        this.assertEqual( Foo().instBaz(), val,
            "Protected methods are accessible to instance methods"
        );

        this.assertEqual( Foo.staticGetProp(), val,
            "Protected static properties are accessible to static methods"
        );

        this.assertEqual( Foo().instGetProp(), val,
            "Protected static properties are accessible to instance methods"
        );
    },


    /**
     * Same as above, but with getters/setters. We can only run this test if
     * getters/setters are supported by the engine running it.
     */
    'Protected static getters/setters accessible inside class only': function()
    {
        // if unsupported, don't bother with the test
        if ( this.fallback )
        {
            return;
        }

        // we must define in this manner so older engines won't blow up due to
        // syntax errors
        var def    = {
                'public static getProp': function()
                {
                    // getters/setters are not accessed using the accessor
                    // method
                    return this.foo;
                },

                'public static setProp': function( val )
                {
                    this.foo = val;
                },
            },
            val    = 'baz',
            called = [];

        Object.defineProperty( def, 'protected static foo', {
            get: function() { return val; },
            set: function() { called[ 0 ] = true; },

            enumerable: true,
        } );

        // define the class
        var Foo = this.builder.build( def );

        this.assertEqual( Foo.getProp(), val,
            "Protected static getters are accessible from within the class"
        );

        Foo.setProp( 'bla' );
        this.assertEqual( called[ 0 ], true,
            "Protected static setters are accessible from within the class"
        );

        this.assertEqual( Foo.foo, undefined,
            "Protected static getters/getters are not public"
        );
    },


    /**
     * As usual, protected members (in this case, static) should be inherited by
     * subtypes.
     *
     * Long function is long. Kids, don't do this at home.
     */
    'Protected static members are inherited by subtypes': function()
    {
        var val  = 'baz',
            val2 = 'bazbaz',
            def = {
            'protected static prop': val,

            'protected static foo': function()
            {
                return val;
            },
        };

        // also test getters/setters if supported
        if ( !this.fallback )
        {
            Object.defineProperty( def, 'protected static bar', {
                get: function() {},
                set: function() {},

                enumerable: true,
            } );

            // used to get the property descriptor of a protected property
            def[ 'public static getPropDesc' ] = function( prop )
            {
                return Object.getOwnPropertyDescriptor( this, prop );
            };
        }

        var Foo  = this.builder.build( def ),

            SubFoo = this.builder.build( Foo,
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

                'public static getProp': function()
                {
                    return this.$('prop');
                },
            } ),

            SubSubFoo = this.builder.build( SubFoo, {} )
        ;

        this.assertEqual( SubFoo.bar(), val,
            "Subtypes inherit parents' protected static methods"
        );

        this.assertEqual( SubFoo.bar2(), val2,
            "Static methods have access to other static methods in the same " +
            "class"
        );

        // for extra assurance, to ensure our recursive implementation is
        // correct
        this.assertEqual( SubSubFoo.bar(), val,
            "Sub-subtypes inherit parents' protected static methods"
        );

        this.assertEqual( SubFoo.getProp(), val,
            "Subtypes inherit parents' protected static properties"
        );

        this.assertEqual( SubSubFoo.getProp(), val,
            "Sub-subtypes inherit parents' protected static properties"
        );

        // getters/setters (if supported by engine)
        if ( !this.fallback )
        {
            var super_data   = Foo.getPropDesc( 'bar' ),
                sub_data     = SubFoo.getPropDesc( 'bar' ),
                sub_sub_data = SubSubFoo.getPropDesc( 'bar' )
            ;

            // getters
            this.assertDeepEqual( super_data.get, sub_data.get,
                "Protected static getters are inherited by subtypes"
            );
            this.assertDeepEqual( super_data.get, sub_sub_data.get,
                "Protected static getters are inherited by sub-subtypes"
            );

            // setters
            this.assertDeepEqual( super_data.set, sub_data.set,
                "Protected static setters are inherited by subtypes"
            );
            this.assertDeepEqual( super_data.set, sub_sub_data.set,
                "Protected static setters are inherited by sub-subtypes"
            );
        }
    },


    /**
     * Private members should be available from within the class, but not
     * outside of it
     */
    'Private static members are available inside class only': function()
    {
        var val = 'foo',
            Foo = this.builder.build(
            {
                'private static prop': val,


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

                'public static staticGetProp': function()
                {
                    return this.$('prop');
                },

                'public instGetProp': function()
                {
                    return this.__self.$('prop');
                },
            } );

        this.assertEqual( Foo.baz, undefined,
            "Private methods should not be accessible outside the class"
        );

        this.assertEqual( Foo.staticBaz(), val,
            "Private methods are accessible to static methods"
        );

        this.assertEqual( Foo().instBaz(), val,
            "Private methods are accessible to instance methods"
        );

        this.assertEqual( Foo.staticGetProp(), val,
            "Private static properties are accessible to static methods"
        );

        this.assertEqual( Foo().instGetProp(), val,
            "Private static properties are accessible to instance methods"
        );
    },


    /**
     * Private static members should not be inherited by subtypes. Of course.
     * Moving along...
     */
    'Private static members are not inherited by subtypes': function()
    {
        var def = {
            'private static prop': 'foo',
            'private static priv': function() {},
        };

        if ( !this.fallback )
        {
            Object.defineProperty( def, 'private static foo', {
                get: function() { return 'foo'; },
                set: function() {},

                enumerable: true,
            } );
        }

        var Foo = this.builder.build( def ),

            SubFoo = this.builder.build( Foo,
            {
                'public static getPriv': function()
                {
                    return this.priv;
                },


                'public static getGetSet': function()
                {
                    return this.foo;
                },

                'public static staticGetProp': function()
                {
                    return this.$('prop');
                },

                'public instGetProp': function()
                {
                    return this.__self.$('prop');
                },
            } )
        ;

        this.assertEqual( SubFoo.getPriv(), undefined,
            "Private static methods should not be inherited by subtypes"
        );

        this.assertEqual( SubFoo.getGetSet(), undefined,
            "Private static getters/setters should not be inherited by subtypes"
        );

        this.assertEqual( SubFoo().instGetProp(), undefined,
            "Private static properties should not be inherited by subtypes " +
            "(inst)"
        );

        this.assertEqual( SubFoo.staticGetProp(), undefined,
            "Private static properties should not be inherited by subtypes " +
            "(static)"
        );
    },


    /**
     * Same as above, but with getters/setters. We can only run this test if
     * getters/setters are supported by the engine running it.
     */
    'Private static getters/setters accessible inside class only': function()
    {
        // if unsupported, don't bother with the test
        if ( this.fallback )
        {
            return;
        }

        // we must define in this manner so older engines won't blow up due to
        // syntax errors
        var def    = {
                'public static getProp': function()
                {
                    // getters/setters are not accessed using the accessor
                    // method
                    return this.foo;
                },

                'public static setProp': function( val )
                {
                    this.foo = val;
                },
            },
            val    = 'baz',
            called = [];

        Object.defineProperty( def, 'private static foo', {
            get: function() { return val; },
            set: function() { called[ 0 ] = true; },

            enumerable: true,
        } );

        // define the class
        var Foo = this.builder.build( def );

        this.assertEqual( Foo.getProp(), val,
            "Private static getters are accessible from within the class"
        );

        Foo.setProp( 'bla' );
        this.assertEqual( called[ 0 ], true,
            "Private static setters are accessible from within the class"
        );

        this.assertEqual( Foo.foo, undefined,
            "Private static getters/getters are not public"
        );
    },


    /**
     * Public and protected static methods should be able to be overridden by
     * subtypes. We needn't test private methods, as they are not inherited.
     */
    'Static methods can be overridden by subtypes': function()
    {
        var val = 'bar',
            Foo = this.builder.build(
            {
                'public static foo': function() {},
                'protected static bar': function() {},
            } ),

            SubFoo = this.builder.build( Foo,
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

        this.assertEqual( SubFoo.foo(), val,
            "Public static methods can be overridden by subtypes"
        );

        this.assertEqual( SubFoo.prot(), val,
            "Protected static methods can be overridden by subtypes"
        );
    },



    /**
     * This tests very closely to the implementation, which is not good.
     * However, it's important to protecting the data. The accessor method works
     * off of context, so it's important to ensure that the data will remain
     * encapsulated if the user attempts to be tricky and bind to a supertype.
     */
    'Cannot exploit accessor method to gain access to parent private props':
    function()
    {
        var Foo = this.builder.build(
            {
                'private static foo': 'bar',
            } ),

            SubFoo = this.builder.build( Foo,
            {
                'public static getParentPrivate': function()
                {
                    return this.$.call( Foo, 'foo' );
                }
            } )
        ;

        this.assertEqual( SubFoo.getParentPrivate(), undefined,
            "Cannot exploit accses modifier to gain access to parent private props"
        );
    },


    /**
     * Static members cannot be overridden. Instead, static members can be
     * *hidden* if a member of the same name is defined by a subtype.
     */
    'Cannot override static members': function()
    {
        var val_orig = 'foobaz',
            val      = 'foobar',

            Foo = this.builder.build(
            {
                'public static prop': val_orig,

                'public static foo': function()
                {
                    return this.bar();
                },

                'public static bar': function()
                {
                    return val_orig;
                },

                'public static baz': function()
                {
                    return this.$( 'prop' );
                },
            } ),

            SubFoo = this.builder.build( Foo,
            {
                'public static prop': val,

                // override parent static method (this is truly overriding, not
                // hiding)
                'public static bar': function()
                {
                    return val;
                },

                'public static getProp': function()
                {
                    return this.$( 'prop' );
                }
            } )
        ;

        // cannot override
        this.assertNotEqual( SubFoo.foo(), val,
            "System does not support overriding static methods"
        );
        this.assertNotEqual( SubFoo.baz(), val,
            "System does not support overriding static properties"
        );

        // but we can hide them
        this.assertEqual( SubFoo.bar(), val,
            "System supports static method hiding"
        );
        this.assertEqual( SubFoo.getProp(), val,
            "System supports static property hiding"
        );
    },


    /**
     * Since members are statically bound, calls to parent methods should retain
     * access to their private members.
     */
    'Calls to parent static methods retain private member access': function()
    {
        var val = 'foobar',
            Foo = this.builder.build(
            {
                'private static _priv': val,

                'public static getPriv': function()
                {
                    return this.$('_priv');
                },
            } ),

            SubFoo = this.builder.build( Foo,
            {
                'public static getPriv2': function()
                {
                    return this.getPriv();
                },
            } )
        ;

        this.assertEqual( SubFoo.getPriv(), val,
            'Calls to parent static methods should retain access to their own ' +
            'private members when called externally'
        );

        this.assertEqual( SubFoo.getPriv2(), val,
            'Calls to parent static methods should retain access to their own ' +
            'private members when called internally'
        );
    },
} );


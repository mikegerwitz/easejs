/**
 * Tests basic trait definition
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
        this.Interface     = this.require( 'interface' );
        this.AbstractClass = this.require( 'class_abstract' );

        this.hasGetSet = !(
            this.require( 'util' ).definePropertyFallback()
        );

        // means of creating anonymous traits
        this.ctor = [
            this.Sut.extend,
            this.Sut,
        ];

        // trait field name conflicts (methods)
        this.fconflict = [
            [ 'foo', "same name; no keywords",
                { foo: function() {} },
                { foo: function() {} },
            ],

            [ 'foo', "same keywords; same visibility",
                { 'public foo': function() {} },
                { 'public foo': function() {} },
            ],

            // should (at least for the time being) be picked up by existing
            // class error checks; TODO: but let's provide trait-specific
            // error messages to avoid frustration and infuriation
            [ 'foo', "varying keywords; same visibility",
                { 'virtual public foo': function() {} },
                { 'public virtual foo': function() {} },
            ],

            [ 'foo', "different visibility",
                { 'public foo':    function() {} },
                { 'protected foo': function() {} },
            ],
        ];

        this.base = [ this.Class ];
    },


    /**
     * We continue with the same concept used for class
     * definitions---extending the Trait module itself will create an
     * anonymous trait.
     */
    '@each(ctor) Can extend Trait to create anonymous trait': function( T )
    {
        this.assertOk( this.Sut.isTrait( T( {} ) ) );
    },


    /**
     * A trait can only be used by something else---it does not make sense
     * to instantiate them directly, since they form an incomplete picture.
     *
     * Now, that said, see parameterized traits.
     */
    '@each(ctor) Cannot instantiate trait without error': function( T )
    {
        this.assertThrows( function()
        {
            T( {} )();
        }, Error );
    },


    /**
     * One way that traits acquire meaning is by their use in creating
     * classes. This also allows us to observe whether traits are actually
     * working as intended without testing too closely to their
     * implementation. This test simply ensures that the Class module will
     * accept our traits.
     *
     * Classes consume traits as part of their definition using the `use'
     * method. We should be able to then invoke the `extend' method to
     * provide our own definition, without having to inherit from another
     * class.
     */
    '@each(ctor) Base class definition is applied when using traits':
    function( T )
    {
        var expected = 'bar';

        var C = this.Class.use( T( {} ) ).extend(
        {
            foo: expected,
        } );

        this.assertOk( this.Class.isClass( C ) );
        this.assertEqual( C().foo, expected );
    },


    /**
     * Traits contribute to the definition of the class that `use's them;
     * therefore, it would stand to reason that we should still be able to
     * inherit from a supertype while using traits.
     */
    '@each(ctor) Supertype definition is applied when using traits':
    function( T )
    {
        var expected  = 'bar',
            expected2 = 'baz',
            Foo       = this.Class( { foo: expected } ),
            SubFoo    = this.Class.use( T( {} ) )
                .extend( Foo, { bar: expected2  } );

        var inst = SubFoo();

        this.assertOk( this.Class.isA( Foo, inst ) );
        this.assertEqual( inst.foo, expected, "Supertype failure" );
        this.assertEqual( inst.bar, expected2, "Subtype failure" );
    },


    /**
     * The above tests have ensured that classes are still operable with
     * traits; we can now test that traits are mixed into the class
     * definition via `use' by asserting on the trait definitions.
     */
    '@each(ctor) Trait definition is mixed into base class definition':
    function( T )
    {
        var called = false;

        var Trait = T( { foo: function() { called = true; } } ),
            inst  = this.Class.use( Trait ).extend( {} )();

        // if mixin was successful, then we should have the `foo' method.
        this.assertDoesNotThrow( function()
        {
            inst.foo();
        }, Error, "Should have access to mixed in fields" );

        // if our variable was not set, then it was a bs copy
        this.assertOk( called, "Mixed in field copy error" );
    },


    /**
     * The above test should apply just the same to subtypes.
     */
    '@each(ctor) Trait definition is mixed into subtype definition':
    function( T )
    {
        var called = false;

        var Trait = T( { foo: function() { called = true; } } ),
            Foo   = this.Class( {} ),
            inst  = this.Class.use( Trait ).extend( Foo, {} )();

        inst.foo();
        this.assertOk( called );
    },


    //
    // At this point, we assume that each ctor method is working as expected
    // (that is---the same); we will proceed to test only a single method of
    // construction under that assumption.
    //


    /**
     * Traits cannot be instantiated, so they need not define __construct
     * for themselves; however, they may wish to influence the construction
     * of anything that uses them. This is poor practice, since that
     * introduces a war between traits to take over the constructor;
     * instead, the class using the traits should handle calling the methods
     * on the traits and we should disallow traits from attempting to set
     * the constructor.
     */
    'Traits cannot define __construct': function()
    {
        try
        {
            this.Sut( { __construct: function() {} } );
        }
        catch ( e )
        {
            this.assertOk( e.message.match( /\b__construct\b/ ) );
            return;
        }

        this.fail( false, true,
            "Traits should not be able to define __construct"
        );
    },


    /**
     * If two traits attempt to define the same field (by name, regardless
     * of its type), then an error should be thrown to warn the developer of
     * a problem; automatic resolution would be a fertile source of nasty
     * and confusing bugs.
     *
     * TODO: conflict resolution through aliasing
     */
    '@each(fconflict) Cannot mix in multiple concrete methods of same name':
    function( dfns )
    {
        var fname = dfns[ 0 ],
            desc  = dfns[ 1 ],
            A     = this.Sut( dfns[ 2 ] ),
            B     = this.Sut( dfns[ 3 ] );

        // this, therefore, should error
        try
        {
            this.Class.use( A, B ).extend( {} );
        }
        catch ( e )
        {
            // the assertion should contain the name of the field that
            // caused the error
            this.assertOk(
                e.message.match( '\\b' + fname + '\\b' ),
                "Error message missing field name: " + e.message
            );

            // TODO: we can also make less people hate us if we include the
            // names of the conflicting traits; in the case of an anonymous
            // trait, maybe include its index in the use list

            return;
        }

        this.fail( false, true, "Mixin must fail on conflict: " + desc );
    },


    /**
     * Traits in ease.js were designed in such a way that an object can be
     * considered to be a type of any of the traits that its class mixes in;
     * this is consistent with the concept of interfaces and provides a very
     * simple and intuitive type system.
     */
    'A class is considered to be a type of each used trait': function()
    {
        var Ta = this.Sut( {} ),
            Tb = this.Sut( {} ),
            Tc = this.Sut( {} ),
            o  = this.Class.use( Ta, Tb ).extend( {} )();

        // these two were mixed in
        this.assertOk( this.Class.isA( Ta, o ) );
        this.assertOk( this.Class.isA( Tb, o ) );

        // this one was not
        this.assertOk( this.Class.isA( Tc, o ) === false );
    },


    /**
     * Ensure that the named class staging object permits mixins.
     */
    'Can mix traits into named class': function()
    {
        var called = false,
            T = this.Sut( { foo: function() { called = true; } } );

        this.Class( 'Named' ).use( T ).extend( {} )().foo();
        this.assertOk( called );
    },


    /**
     * When explicitly defining a class (that is, not mixing into an
     * existing class definition), which involves the use of Class or
     * AbstractClass, mixins must be terminated with a call to `extend'.
     * This allows the system to make a final determination as to whether
     * the resulting class is abstract.
     *
     * Contrast this with Type.use( T )( ... ), where Type is not the base
     * class (Class) or AbstractClass.
     */
    'Explicit class definitions must be terminated by an extend call':
    function()
    {
        var _self = this,
            Ta    = this.Sut( { foo: function() {} } ),
            Tb    = this.Sut( { bar: function() {} } );

        // does not complete with call to `extend'
        this.assertThrows( function()
        {
            _self.Class.use( Ta )();
        }, TypeError );

        // nested uses; does not complete
        this.assertThrows( function()
        {
            _self.Class.use( Ta ).use( Tb )();
        }, TypeError );

        // similar to above, with abstract; note that we're checking for
        // TypeError here
        this.assertThrows( function()
        {
            _self.AbstractClass.use( Ta )();
        }, TypeError );

        // does complete; OK
        this.assertDoesNotThrow( function()
        {
            _self.Class.use( Ta ).extend( {} )();
            _self.Class.use( Ta ).use( Tb ).extend( {} )();
        } );
    },


    /**
     * Ensure that the staging object created by the `implement' call
     * exposes a `use' method (and properly applies it).
     */
    'Can mix traits into class after implementing interface': function()
    {
        var _self  = this,
            called = false,

            T = this.Sut( { foo: function() { called = true; } } ),
            I = this.Interface( { bar: [] } ),
            A = null;

        // by declaring this abstract, we ensure that the interface was
        // actually implemented (otherwise, all methods would be concrete,
        // resulting in an error)
        this.assertDoesNotThrow( function()
        {
            A = _self.AbstractClass.implement( I ).use( T ).extend( {} );
            _self.assertOk( A.isAbstract() );
        } );

        // ensure that we actually fail if there's no interface implemented
        // (and thus no abstract members); if we fail and the previous test
        // succeeds, that implies that somehow the mixin is causing the
        // class to become abstract, and that is an issue (and the reason
        // for this seemingly redundant test)
        this.assertThrows( function()
        {
            _self.Class.implement( I ).use( T ).extend( {} );
        } );

        A.extend( { bar: function() {} } )().foo();
        this.assertOk( called );
    },


    /**
     * When a trait is mixed into a class, it acts as though it is part of
     * that class. Therefore, it should stand to reason that, when a mixed
     * in method returns `this', it should actually return the instance of
     * the class that it is mixed into (in the case of this test, its
     * private member object, since that's our context when invoking the
     * trait method).
     */
    'Trait method that returns self will return containing class':
    function()
    {
        var _self = this,
            T     = this.Sut( { foo: function() { return this; } } );

        this.Class.use( T ).extend(
        {
            go: function()
            {
                _self.assertStrictEqual( this, this.foo() );
            },
        } )().go();
    },


    /**
     * Support for static members will be added in future versions; this is
     * not something that the author wanted to rush for the first trait
     * release, as static members have their own odd quirks.
     */
    'Trait static members are prohibited': function()
    {
        var Sut = this.Sut;

        // property
        this.assertThrows( function()
        {
            Sut( { 'static private foo': 'prop' } );
        } );

        // method
        this.assertThrows( function()
        {
            Sut( { 'static foo': function() {} } );
        } );
    },


    /**
     * For the same reasons as static members (described immediately above),
     * getters/setters are unsupported until future versions.
     *
     * Note that we use defineProperty instead of the short-hand object
     * literal notation to avoid syntax errors in pre-ES5 environments.
     */
    'Trait getters and setters are prohibited': function()
    {
        // perform these tests only when getters/setters are supported by
        // our environment
        if ( !( this.hasGetSet ) )
        {
            return;
        }

        var Sut = this.Sut;

        this.assertThrows( function()
        {
            var dfn = {};
            Object.defineProperty( dfn, 'foo',
            {
                get: function() {},
                set: function() {},

                enumerable: true,
            } );

            Sut( dfn );
        } );
    },
} );

/**
 * Tests basic trait definition
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
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut   = this.require( 'Trait' );
        this.Class = this.require( 'class' );

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
            // class error checks
            [ 'foo', "varying keywords; same visibility",
                { 'virtual public foo': function() {} },
                { 'public virtual foo': function() {} },
            ],

            /* TODO
            [ 'foo', "different visibility",
                { 'public foo':    function() {} },
                { 'protected foo': function() {} },
            ],
            */
        ];
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
        var expected  = 'bar';
            expected2 = 'baz';
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

        this.fail( "Traits should not be able to define __construct" );
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
                "Missing field name"
            );

            // TODO: we can also make less people hate us if we include the
            // names of the conflicting traits; in the case of an anonymous
            // trait, maybe include its index in the use list

            return;
        }

        this.fail( false, true, "Mixin must fail on conflict: " + desc );
    },


    'Private class members are not accessible to used traits': function()
    {
        // TODO: this is not yet the case
    },


    /**
     * Traits will need to be able to keep and manipulate their own internal
     * state.
     */
    'Private trait members are not accessible to containing class':
    function()
    {
        // TODO: this is not yet the case
    },
} );

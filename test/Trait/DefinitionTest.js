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
} );

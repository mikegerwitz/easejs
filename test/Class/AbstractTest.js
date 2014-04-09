/**
 * Tests abstract classes
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
        this.Sut   = this.require( 'class_abstract' );
        this.Class = this.require( 'class' );
    },


    /**
     * In order to ensure that the code documents itself, we should require
     * that all classes containing abstract members must themselves be
     * declared as abstract.  Otherwise, you are at the mercy of the
     * developer's documentation/comments to know whether or not the class
     * is indeed abstract without looking through its definition.
     */
    'Must declare classes with abstract members as abstract': function()
    {
        try
        {
            // should fail; class not declared as abstract
            this.Class( 'Foo',
            {
                'abstract foo': [],
            } );
        }
        catch ( e )
        {
            this.assertOk(
                e.message.search( 'Foo' ) !== -1,
                "Abstract class declaration error should contain class name"
            );

            return;
        }

        this.assertFail(
            "Should not be able to declare abstract members unless " +
                "class is also declared as abstract"
        );
    },


    /**
     * Abstract members should be permitted if the class itself is declared
     * as abstract; converse of above test.
     */
    'Can declare class as abstract': function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            Sut(
            {
                'abstract foo': [],
            } );
        }, Error );
    },


    /**
     * If a class is declared as abstract, it should contain at least one
     * abstract method. Otherwise, the abstract definition is pointless and
     * unnecessarily confusing---the whole point of the declaration is
     * to produce self-documenting code.
     */
    'Abstract classes must contain abstract methods': function()
    {
        try
        {
            // should fail; class not declared as abstract
            this.Sut( 'Foo', {} );
        }
        catch ( e )
        {
            this.assertOk(
                e.message.search( 'Foo' ) !== -1,
                "Abstract class declaration error should contain class name"
            );

            return;
        }

        this.assertFail(
            "Abstract classes should contain at least one abstract method"
        );
    },


    /**
     * Abstract methods should remain virtual until they are defined.
     * That is, if a subtype doesn't provide a concrete implementation, it
     * should still be considered virtual.
     */
    'Abstract methods can be defined concretely by sub-subtypes': function()
    {
        var AbstractFoo = this.Sut( 'Foo',
            {
                'abstract foo': [],
            } ),

            SubAbstractFoo = this.Sut.extend( AbstractFoo, {} );

        var Class = this.Class;
        this.assertDoesNotThrow( function()
        {
            Class.extend( SubAbstractFoo,
            {
                // we should NOT need the override keyword for concrete
                // implementations of abstract super methods
                'foo': function() {},
            } )
        }, Error );
    },


    /**
     * Just as Class contains an extend method, so should AbstractClass.
     */
    'Abstract class extend method returns new class': function()
    {
        this.assertEqual( typeof this.Sut.extend, 'function',
            "AbstractClass contains extend method"
        );

        this.assertOk(
            this.Class.isClass(
                this.Sut.extend( { 'abstract foo': [] } )
            ),
            "Abstract class extend method returns class"
        );
    },


    /**
     * Just as Class contains an implement method, so should AbstractClass.
     * We test implementation further on in this test case.
     */
    'Abstract class contains implement method': function()
    {
        this.assertEqual( typeof this.Sut.implement, 'function',
            "AbstractClass contains implement method"
        );
    },


    /**
     * All classes should have a method to determine if they are abstract.
     * We test specific cases below.
     */
    'All classes have an isAbstract() method': function()
    {
        this.assertEqual(
            typeof ( this.Class( {} ).isAbstract ),
            'function'
        );
    },


    /**
     * For this test, note that (as was tested above) a class containing
     * abstract members must be declared as abstract; therefore, this test
     * extends to assert that classes with no abstract methods are not
     * considered to be abstract.
     */
    'Concrete classes are not considered to be abstract': function()
    {
        this.assertOk( !( this.Class( {} ).isAbstract() ) );
    },


    /**
     * In the same spirit as the preceding test, this extends to asserting
     * that a class containing abstract methods must be considered to be
     * abstract.
     */
    'Abstract classes are considered to be abstract': function()
    {
        this.assertOk(
            this.Sut( { 'abstract method': [] } ).isAbstract()
        );
    },


    /**
     * In the spirit of the aforementioned, subtypes that do not provide
     * concrete definitions for *all* abstract methods of their supertype
     * must too be considered to be abstract.
     */
    'Subtypes are abstract if no concrete method is provided': function()
    {
        var Base = this.Sut(
        {
            'abstract foo': [],
            'abstract bar': [],
        } );

        this.assertOk(
            this.Sut.extend( Base,
            {
                // only provide concrete impl. for a single method; `bar' is
                // still abstract
                foo: function() {}
            } ).isAbstract()
        );
    },


    /**
     * Ensure that a subtype is not considered to be abstract if it provides
     * concrete definitions of each of its supertype's abstract methods.
     */
    'Subtypes are not considered abstract if concrete methods are provided':
    function()
    {
        var Base = this.Sut(
        {
            'abstract foo': [],
            'abstract bar': [],
        } );

        this.assertOk(
            this.Class.extend( Base,
            {
                // provide concrete impls. for both
                foo: function() {},
                bar: function() {},
            } ).isAbstract() === false
        );
    },


    /**
     * Since an abstract class does not provide a complete object
     * description, it cannot be instantiated.
     */
    'Abstract classes cannot be instantiated': function()
    {
        var Sut = this.Sut;
        this.assertThrows( function()
        {
            Sut( { 'abstract foo': [] } )();
        }, Error );
    },


    /**
     * However, a concrete subtype of an abstract class may be instantiated.
     * Otherwise abstract classes would be pretty useless.
     */
    'Concrete subtypes of abstract classes can be instantiated': function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            Sut( { 'abstract foo': [] } )
                .extend( { foo: function() {} } )
                ();
        }, Error );
    },


    /**
     * Even though an abstract class itself cannot be instantiated, its
     * constructor may still be inherited (and therefore invoked) through
     * concrete subtypes.
     */
    'Can call constructors of abstract supertypes': function()
    {
        var ctor_called = false;
        this.Sut(
        {
            __construct: function() { ctor_called = true; },
            'abstract foo': [],
        } ).extend( { foo: function() {} } )();

        this.assertOk( ctor_called );
    },


    /**
     * Abstract methods declare an API strictly for the purpose of ensuring
     * that subtypes are all compatible with respect to that particular
     * field; parameter count, therefore, should be enforced to point out
     * potential bugs to developers. Whether or not the subtype makes use of
     * a particular argument is a separate and unrelated issue.
     */
    'Concrete methods must implement the proper number of parameters':
    function()
    {
        var Sut = this.Sut;
        this.assertThrows( function()
        {
            // concrete implementation missing parameter `two'
            Sut( { 'abstract foo': [ 'one', 'two' ] } )
                .extend( { foo: function( one ) {} } );
        }, Error );
    },


    /**
     * It may be the case that a subtype wishes to provide a new definition
     * for a particular abstract method---without providing a concrete
     * implementation---to add additional parameters. However, to remain
     * compatible with the supertype, that implementation must provide at
     * least the same number of arguments as the respective method of the
     * supertype.
     *
     * This tests the error condition; see below for the complement.
     */
    'Abstract methods of subtypes must declare compatible parameter count':
    function()
    {
        var Sut = this.Sut;
        this.assertThrows( function()
        {
            Sut.extend( Sut( { 'abstract foo': [ 'one' ] } ),
            {
                // incorrect number of arguments
                'abstract foo': [],
            } );
        }, TypeError );
    },


    /**
     * Complements the above test to ensure that compatible abstract
     * overrides are permitted.
     */
    'Abstract members may implement more parameters than supertype':
    function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            Sut.extend( Sut( { 'abstract foo': [ 'one' ] } ),
            {
                // one greater
                'abstract foo': [ 'one', 'two' ],
            } );
        }, Error );
    },


    /**
     * While this may not necessarily be sensical in all situations, it may
     * be useful for documentation.
     */
    'Abstract members may implement equal parameters to supertype':
    function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            Sut.extend( Sut( { 'abstract foo': [ 'one' ] } ),
            {
                // same number
                'abstract foo': [ 'one' ],
            } );
        }, Error );
    },


    /**
     * This test just ensures consistency by ensuring that an empty
     * parameter definition for abstract methods imposes no parameter count
     * requirement on its concrete definition.
     */
    'Concrete methods have no parameter requirement with empty definition':
    function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            Sut( { 'abstract foo': [] } ).extend(
            {
                foo: function() {}
            } );
        }, Error );
    },


    /**
     * An abstract method is represented by an array listing its parameters
     * (that must be implemented by concrete definitions).
     */
    'Abstract methods must be declared as arrays': function()
    {
        var Class = this.Class;

        this.assertThrows( function()
        {
            // likely demonstrates misunderstanding of the syntax
            Class.extend( { 'abstract foo': function() {} } );
        }, TypeError, "Abstract method cannot be declared as a function" );

        this.assertThrows( function()
        {
            // might be common mistake for attempting to denote a single
            // parameter; pure speculation.
            Class.extend( { 'abstract foo': 'scalar' } );
        }, TypeError, "Abstract method cannot be declared as a scalar" );
    },


    /**
     * There was an issue where the object holding the abstract methods list
     * was not checking for methods by using hasOwnProperty(). Therefore, if
     * a method such as toString() was defined, it would be matched in the
     * abstract methods list. As such, the abstract methods count would be
     * decreased, even though it was not an abstract method to begin with
     * (nor was it removed from the list, because it was never defined in
     * the first place outside of the prototype).
     *
     * This negative number !== 0, which causes a problem when checking to
     * ensure that there are 0 abstract methods. We check explicitly for 0
     * because, if it's non-zero, then it's either abstract or something is
     * wrong. Negative is especially wrong. It should never be negative!
     */
    'Does not recognize object prototype members as abstract': function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            Sut( { 'abstract method': [] } ).extend(
            {
                // concrete, so the result would otherwise not be abstract
                method: function() {},

                // the problem---this exists in the prototype chain of every
                // object
                'toString': function() {},
            })();
        }, Error );
    },


    /**
     * Ensure we support named abstract class extending
     */
    'Can create named abstract subtypes': function()
    {
        this.assertOk(
            this.Sut( 'Named' ).extend(
                this.Sut( { 'abstract foo': [] } ),
                {}
            ).isAbstract()
        );
    },


    /**
     * Abstract classes, when extended, should yield a concrete class by
     * default. Otherwise, the user should once again use AbstractClass to
     * clearly state that the subtype is abstract. Remember:
     * self-documenting.
     */
    'Calling extend() on abstract class yields concrete class': function()
    {
        var Foo        = this.Sut( { 'abstract foo': [] } ),
            cls_named  = this.Sut( 'NamedSubFoo' ).extend( Foo, {} ),
            cls_anon   = this.Sut.extend( Foo, {} );

        var Class = this.Class;

        // named
        this.assertThrows(
            function()
            {
                // should throw an error, since we're not declaring it as
                // abstract and we're not providing a concrete impl
                Class.isAbstract( cls_named.extend( {} ) );
            },
            TypeError,
            "Extending named abstract classes should be concrete"
        );

        // anonymous
        this.assertThrows(
            function()
            {
                // should throw an error, since we're not declaring it as abstract
                // and we're not providing a concrete impl
                Class.isAbstract( cls_anon.extend( {} ) );
            },
            TypeError,
            "Extending anonymous abstract classes should be concrete"
        );
    },


    /**
     * Extending an abstract class after an implement() should still result
     * in an abstract class. Essentially, we are testing to ensure that the
     * extend() method is properly wrapped to flag the resulting class as
     * abstract. This was a bug.
     */
    'Implementing interfaces will preserve abstract class definition':
    function()
    {
        var Sut       = this.Sut,
            Interface = this.require( 'interface' );

        this.assertOk(
            // if not considered abstract, extend() will fail, as it will
            // contain abstract member foo
            Sut( 'TestImplExtend' )
                .implement( Interface( { foo: [] } ) )
                .extend( {} )
                .isAbstract()
        );
    },
} );

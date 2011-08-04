/**
 * Tests abstract classes
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

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' ),

    Class         = common.require( 'class' ),
    AbstractClass = common.require( 'class_abstract' )
;


/**
 * In order to ensure the code documents itself, we should require that all
 * classes containing abstract members must themselves be declared as abstract.
 * Otherwise, you are at the mercy of the developer's documentation/comments to
 * know whether or not the class is indeed abstract without looking through its
 * definition.
 */
( function testMustDeclareClassesWithAbstractMembersAsAbstract()
{
    try
    {
        // should fail; class not declared as abstract
        Class( 'Foo',
        {
            'abstract foo': [],
        } );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( 'Foo' ) !== -1,
            "Abstract class declaration error should contain class name"
        );

        return;
    }

    assert.fail(
        "Should not be able to declare abstract members unless class is also " +
        "declared as abstract"
    );
} )();


/**
 * Abstract members should be permitted if the class itself is declared as
 * abstract
 */
( function testCanDeclareClassAsAbstract()
{
    AbstractClass(
    {
        'abstract foo': [],
    } );
} )();


/**
 * If a class is declared as abstract, it should contain at least one abstract
 * method. Otherwise, the abstract definition is pointless and unnecessarily
 * confusing. The whole point of the declaration is self-documenting code.
 */
( function testAbstractClassesMustContainAbstractMethods()
{
    try
    {
        // should fail; class not declared as abstract
        AbstractClass( 'Foo', {} );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( 'Foo' ) !== -1,
            "Abstract class declaration error should contain class name"
        );

        return;
    }

    assert.fail(
        "Abstract classes should contain at least one abstract method"
    );
} )();


/**
 * Abstract methods should remain virtual until they are overridden. That is, if
 * a subtype doesn't provide a concrete implementation, it should still be
 * considered virtual.
 */
( function testAbstractMethodsCanBeOverriddenBySubSubTypes()
{
    var AbstractFoo = AbstractClass( 'Foo',
        {
            'abstract foo': [],
        } ),

        SubAbstractFoo = AbstractClass.extend( AbstractFoo, {} ),

        ConcreteFoo = Class.extend( SubAbstractFoo,
        {
            // we should NOT need the override keyword for concrete
            // implementations of abstract super methods
            'foo': function() {},
        } )
    ;
} )();


/**
 * Just as Class contains an extend method, so should AbstractClass.
 */
( function testAbstractClassExtendMethodReturnsNewClass()
{
    assert.ok( typeof AbstractClass.extend === 'function',
        "AbstractClass contains extend method"
    );

    assert.ok(
        Class.isClass(
            AbstractClass.extend( { 'abstract foo': [] } )
        ),
        "Abstract class extend method returns class"
    );
} )();


/**
 * Just as Class contains an implement method, so should AbstractClass.
 */
( function testAbstractClassContainsImplementMethod()
{
    assert.ok( typeof AbstractClass.implement === 'function',
        "AbstractClass contains implement method"
    );
} )();


// not abstract
var Foo = Class.extend( {} );

// abstract (ctor_called is not a class member to ensure that visibility bugs do
// not impact our test)
var ctor_called = false,
    AbstractFoo = AbstractClass.extend(
    {
        __construct: function()
        {
            ctor_called = true;
        },

        'abstract method': [ 'one', 'two', 'three' ],

        'abstract second': [],
    })
;

// still abstract (didn't provide a concrete implementation of both abstract
// methods)
var SubAbstractFoo = AbstractClass.extend( AbstractFoo,
{
    second: function()
    {
    },
});

// concrete
var ConcreteFoo = Class.extend( AbstractFoo,
{
    method: function( one, two, three )
    {
    },

    second: function()
    {
    },
});


/**
 * All classes should have a method to determine if they are abstract.
 */
( function testAllClassesHaveAMethodToDetmineIfAbstract()
{
    assert.ok(
        ( Class( {} ).isAbstract instanceof Function ),
        "All classes should have an isAbstract() method"
    );
} )();


( function testClassesAreNotConsideredToBeAbstractIfTheyHaveNoAbstractMethods()
{
    assert.equal(
        Class( {} ).isAbstract(),
        false,
        "Classes are not abstract if they contain no abstract methods"
    );
} )();


( function testClassesShouldBeConsideredAbstractIfTheyContainAbstractMethods()
{
    assert.equal(
        AbstractFoo.isAbstract(),
        true,
        "Classes should be considered abstract if they contain any abstract methods"
    );
} )();


( function testSubtypesAreAbstractIfNoConcreteMethodIsProvided()
{
    assert.equal(
        SubAbstractFoo.isAbstract(),
        true,
        "Subtypes of abstract types are abstract if they don't provide a " +
            "concrete implementation for all abstract methods"
    );
} )();


( function testSubtypesAreNotConisderedAbstractIfConcreteImplIsProvided()
{
    assert.equal(
        ConcreteFoo.isAbstract(),
        false,
        "Subtypes of abstract types are not abstract if they provide concrete " +
            "implementations of all abstract methods"
    );
} )();


( function testAbstractClassesCannotBeInstantiated()
{
    assert.throws( function()
    {
        // both should fail
        AbstractFoo();
        SubAbstractFoo();
    }, Error, "Abstract classes cannot be instantiated" );
} )();


( function testConcreteSubclassesCanBeInstantiated()
{
    assert.ok(
        ConcreteFoo(),
        "Concrete subclasses can be instantiated"
    );
} )();


( function testCanCallConstructorsOfAbstractSupertypes()
{
    ctor_called = false;
    ConcreteFoo();

    assert.equal(
        ctor_called,
        true,
        "Can call constructors of abstract supertypes"
    );
} )();


( function testConcreteMethodsMustImplementTheProperNumberOfArguments()
{
    assert.throws( function()
    {
        AbstractFoo.extend(
        {
            // incorrect number of arguments
            method: function()
            {
            },
        });
    }, Error, "Concrete methods must implement the proper number of argments" );
} )();


( function testAbstractMethodsOfSubtypesMustImplementProperNumberOfArguments()
{
    assert.throws(
        function()
        {
            AbstractFoo.extend(
            {
                // incorrect number of arguments
                'abstract method': [],
            });
        },
        TypeError,
        "Abstract methods of subtypes must implement the proper number of " +
            "argments"
    );
} )();


( function testAbstractMembersMayImplementMoreArgumentsThanSupertype()
{
    assert.doesNotThrow(
        function()
        {
            AbstractClass.extend( AbstractFoo,
            {
                // incorrect number of arguments
                'abstract method': [ 'one', 'two', 'three', 'four' ],
            });
        },
        Error,
        "Abstract methods of subtypes may implement additional arguments, " +
            "so long as they implement at least the required number of " +
            "arguments as defined by it supertype"
    );
} )();


( function testConcreteMethodsHaveNoArgumentRequirementsIfNoDefinitionGiven()
{
    assert.doesNotThrow(
        function()
        {
            AbstractClass.extend( AbstractFoo,
            {
                second: function( foo )
                {
                },
            });
        },
        Error,
        "Concrete methods needn't implement the proper number of arguments " +
            "if no definition was provided"
    );
} )();


( function testAbstractMethodsMustBeDeclaredAsArrays()
{
    assert.throws( function()
    {
        Class.extend(
        {
            // not an array (invalid)
            'abstract foo': 'scalar',
        } );
    }, TypeError, "Abstract methods must be declared as arrays" );
} )();


/**
 * There was an issue where the object holding the abstract methods list was not
 * checking for methods by using hasOwnProperty(). Therefore, if a method such
 * as toString() was defined, it would be matched in the abstract methods list.
 * As such, the abstract methods count would be decreased, even though it was
 * not an abstract method to begin with (nor was it removed from the list,
 * because it was never defined in the first place outside of the prototype).
 *
 * This negative number !== 0, which causes a problem when checking to ensure
 * that there are 0 abstract methods. We check explicitly for 0 for two reasons:
 * (a) it's faster than <, and (b - most importantly) if it's non-zero, then
 * it's either abstract or something is wrong. Negative is especially wrong. It
 * should never be negative!
 */
( function testDoesNotRecognizeObjectPrototypeMembersAsAbstractWhenDefining()
{
    assert.doesNotThrow( function()
    {
        Class.extend( SubAbstractFoo,
        {
            // concrete, so the result would otherwise not be abstract
            'method': function( one, two, three ) {},

            // the problem
            'toString': function() {},
        })();
    }, Error, "Should not throw error if overriding a prototype method" );
} )();


/**
 * Ensure we support named abstract class extending
 */
( function testCanCreateNamedAbstractSubtypes()
{
    assert.doesNotThrow( function()
    {
        var cls = AbstractClass( 'NamedSubFoo' ).extend( AbstractFoo, {} );
    }, Error, "Can create named abstract subtypes" );
} )();


/**
 * Abstract classes, when extended, should yield a concrete class by default.
 * Otherwise, the user should once again use AbstractClass to clearly state that
 * the subtype is abstract.
 */
( function testExtendingAbstractClassIsNotAbstractByDefault()
{
    var cls_named  = AbstractClass( 'NamedSubFoo' ).extend( AbstractFoo, {} ),
        anon_named = AbstractClass.extend( AbstractFoo, {} );

    // named
    assert.throws(
        function()
        {
            // should throw an error, since we're not declaring it as abstract
            // and we're not providing a concrete impl
            Class.isAbstract( cls_named.extend( {} ) );
        },
        TypeError,
        "Extending named abstract classes should be concrete by default"
    );

    // anonymous
    assert.throws(
        function()
        {
            // should throw an error, since we're not declaring it as abstract
            // and we're not providing a concrete impl
            Class.isAbstract( AbstractFoo.extend( {} ) );
        },
        TypeError,
        "Extending anonymous abstract classes should be concrete by default"
    );
} )();


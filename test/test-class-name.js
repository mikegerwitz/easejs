/**
 * Tests class naming
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

    Class         = common.require( 'class' ),
    AbstractClass = common.require( 'class_abstract' ),
    Interface     = common.require( 'interface' )
;


/**
 * Classes may be named by passing the name as the first argument to the module
 */
( function testClassAcceptsName()
{
    assert.doesNotThrow( function()
    {
        var cls = Class( 'Foo', {} );

        assert.equal(
            Class.isClass( cls ),
            true,
            "Class defined with name is returned as a valid class"
        );
    }, Error, "Class accepts name" );
} )();


/**
 * The class definition must be an object, which is equivalent to the class
 * body
 */
( function testNamedClassDefinitionRequiresThatDefinitionBeAnObject()
{
    var name = 'Foo';

    try
    {
        Class( name, 'Bar' );

        // if all goes well, we'll never get to this point
        assert.fail( "Second argument to named class must be the definition" );
    }
    catch ( e )
    {
        assert.notEqual(
            e.message.match( name ),
            null,
            "Class definition argument count error string contains class name"
        );
    }
} )();


/**
 * Extraneous arguments likely indicate a misunderstanding of the API
 */
( function testNamedClassDefinitionIsStrictOnArgumentCount()
{
    var name = 'Foo',
        args = [ name, {}, 'extra' ]
    ;

    // we should be permitted only two arguments
    try
    {
        Class.apply( null, args );

        // we should not get to this line (an exception should be thrown due to
        // too many arguments)
        assert.fail(
            "Should accept only two arguments when creating named class"
        );
    }
    catch ( e )
    {
        var errstr = e.message;

        assert.notEqual(
            errstr.match( name ),
            null,
            "Named class error should provide name of class"
        );

        assert.notEqual(
            errstr.match( args.length + ' given' ),
            null,
            "Named class error should provide number of given arguments"
        );
    }
} )();


/**
 * By default, anonymous classes should just state that they are a class when
 * they are converted to a string
 */
( function testConvertingAnonymousClassToStringYieldsClassString()
{
    // concrete
    assert.equal(
        Class( {} ).toString(),
        '(Class)',
        "Converting anonymous class to string yields class string"
    );

    // abstract
    assert.equal(
        AbstractClass( { 'abstract foo': [] } ).toString(),
        '(AbstractClass)',
        "Converting abstract anonymous class to string yields class string"
    );
} )();


/**
 * If the class is named, then the name should be presented when it is converted
 * to a string
 */
( function testConvertingNamedClassToStringYieldsClassStringContainingName()
{
    var name = 'Foo';

    // concrete
    assert.equal(
        Class( name, {} ).toString(),
        name,
        "Converting named class to string yields string with name of class"
    );

    // abstract
    assert.equal(
        AbstractClass( name, { 'abstract foo': [] } ).toString(),
        name,
        "Converting abstract named class to string yields string with name " +
            "of class"
    );
} )();


/**
 * Class instances are displayed differently than uninstantiated classes.
 * Mainly, they output that they are an object, in addition to the class name.
 */
( function testConvertingClassInstanceToStringYieldsInstanceString()
{
    var name = 'Foo',

        anon  = Class( {} )(),
        named = Class( name, {} )()
    ;

    // anonymous
    assert.equal(
        anon.toString(),
        '#<anonymous>',
        "Converting anonymous class instance to string yields string " +
            "indiciating that the class is anonymous"
    );

    // named
    assert.equal(
        named.toString(),
        '#<' + name + '>',
        "Converting named class instance to string yields string with name " +
            "of class"
    );
} )();


/**
 * In order to accommodate syntax such as extending classes, ease.js supports
 * staging class names. This will return an object that operates exactly like
 * the normal Class module, but will result in a named class once the class is
 * created.
 */
( function testCanCreateNamedClassUsingStagingMethod()
{
    var name   = 'Foo',
        named  = Class( name ).extend( {} ),
        namedi = Class( name ).implement( Interface( {} ) ).extend( {} ),

        // we should also be able to extend classes in this manner
        namede = Class( name ).implement( Interface( {} ) ).extend( named, {} )
    ;

    // ensure what was returned is a valid class
    assert.equal(
        Class.isClass( named ),
        true,
        "Named class generated via staging method is considered to be a " +
            "valid class"
    );

    // was the name set?
    assert.equal(
        named.toString(),
        name,
        "Name is set on named clas via staging method"
    );


    // we should also be able to implement interfaces
    assert.equal(
        Class.isClass( namedi ),
        true,
        "Named class generated via staging method, implementing an " +
            "interface, is considered to be a valid class"
    );

    assert.equal(
        namedi.toString(),
        name,
        "Name is set on named class via staging method when implementing"
    );


    // we should be able to extend existing classes
    assert.equal(
        Class.isClass( namede ),
        true,
        "Named class generated via staging method, implementing an " +
            "interface, and extending an existing class is considered " +
            "to be a valid class"
    );

    assert.equal(
        Class.isInstanceOf( named, namede() ),
        true,
        "Named class extending base class is instance of the base class"
    );

    assert.equal(
        namede.toString(),
        name,
        "Name is set on named class via staging method when implementing " +
            "and extending"
    );
} )();


/**
 * The class name should be provided in the error thrown when attempting to
 * instantiate an abstract class, if it's available
 */
( function testClassNameIsGivenWhenTryingToInstantiateAbstractClass()
{
    var name = 'Foo';

    try
    {
        Class( name, { 'abstract foo': [] } )();

        // we're not here to test to make sure it is thrown, but if it's not,
        // then there's likely a problem
        assert.fail(
            "Was expecting instantiation error. There's a bug somewhere!"
        );
    }
    catch ( e )
    {
        assert.notEqual(
            e.message.match( name ),
            null,
            "Abstract class instantiation error should contain class name"
        );
    }

    // if no name is provided, then (anonymous) should be indicated
    try
    {
        Class( { 'abstract foo': [] } )();

        // we're not here to test to make sure it is thrown, but if it's not,
        // then there's likely a problem
        assert.fail(
            "Was expecting instantiation error. There's a bug somewhere!"
        );
    }
    catch ( e )
    {
        assert.notEqual(
            e.message.match( '(anonymous)' ),
            null,
            "Abstract class instantiation error should recognize that class " +
                "is anonymous if no name was given"
        );
    }
} )();


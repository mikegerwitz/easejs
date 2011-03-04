/**
 * Tests class naming
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
    Class  = common.require( 'class' )
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

    // the second argument must be an object
    assert.throws( function()
    {
        Class( 'Foo', 'Bar' );
    }, TypeError, "Second argument to named class must be the definition" );
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
        '[object Class]',
        "Converting anonymous class to string yields class string"
    );

    // abstract
    assert.equal(
        Class( { 'abstract foo': [] } ).toString(),
        '[object AbstractClass]',
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
        '[object Class <' + name + '>]',
        "Converting named class to string yields string with name of class"
    );

    // abstract
    assert.equal(
        Class( name, { 'abstract foo': [] } ).toString(),
        '[object AbstractClass <' + name + '>]',
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
        '[object #<anonymous>]',
        "Converting anonymous class instance to string yields string " +
            "indiciating that the class is anonymous"
    );

    // named
    assert.equal(
        named.toString(),
        '[object #<' + name + '>]',
        "Converting named class instance to string yields string with name " +
            "of class"
    );
} )();


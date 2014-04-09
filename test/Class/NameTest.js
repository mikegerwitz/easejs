/**
 * Tests class naming
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
 *
 * TODO: This would benefit from an assertion that combines an exception
 *       test with an assertion on is message.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut           = this.require( 'class' );
        this.AbstractClass = this.require( 'class_abstract' );
    },


    /**
     * Classes may be named by passing the name as the first argument to the
     * module
     */
    'Class defined with name is returned as a valid class': function()
    {
        this.assertOk(
            this.Sut.isClass( this.Sut( 'Foo', {} ) )
        );
    },


    /**
     * The class definition must be an object, which is equivalent to the
     * class body
     */
    'Named class definition requires that field definition be an object':
    function()
    {
        var name = 'Foo';

        try
        {
            this.Sut( name, 'Bar' );

            // if all goes well, we'll never get to this point
            this.assertFail(
                "Second argument to named class must be the definition"
            );
        }
        catch ( e )
        {
            this.assertNotEqual(
                e.message.match( name ),
                null,
                "Error string contains class name"
            );
        }
    },


    /**
     * Extraneous arguments likely indicate a misunderstanding of the API
     */
    'Named class definition is strict on argument count': function()
    {
        var name = 'Foo',
            args = [ name, {}, 'extra' ]
        ;

        // we should be permitted only two arguments
        try
        {
            this.Sut.apply( null, args );

            // we should not get to this line (an exception should be thrown
            // due to too many arguments)
            this.assertFail(
                "Should accept only two arguments when creating named class"
            );
        }
        catch ( e )
        {
            var errstr = e.message;

            this.assertNotEqual(
                errstr.match( name ),
                null,
                "Named class error should provide name of class"
            );

            this.assertNotEqual(
                errstr.match( args.length + ' given' ),
                null,
                "Named class error should provide number of given arguments"
            );
        }
    },


    /**
     * By default, anonymous classes should just state that they are a class
     * when they are converted to a string
     */
    'Converting anonymous class to string yields class string': function()
    {
        // concrete
        this.assertEqual(
            this.Sut( {} ).toString(),
            '(Class)'
        );
    },


    /**
     * Similar concept to above
     */
    'Converting abstract anonymous class to string yields class string':
    function()
    {
        this.assertEqual(
            this.AbstractClass( { 'abstract foo': [] } ).toString(),
            '(AbstractClass)'
        );
    },


    /**
     * If the class is named, then the name should be presented when it is
     * converted to a string
     */
    'Converting named class to string yields string containing name':
    function()
    {
        var name = 'Foo';

        // concrete
        this.assertEqual(
            this.Sut( name, {} ).toString(),
            name
        );

        // abstract
        this.assertEqual(
            this.AbstractClass( name, { 'abstract foo': [] } ).toString(),
            name
        );
    },


    /**
     * Class instances are displayed differently than uninstantiated
     * classes. Mainly, they output that they are an object, in addition to
     * the class name.
     */
    'Converting class instance to string yields instance string':
    function()
    {
        var name  = 'Foo',
            anon  = this.Sut( {} )(),
            named = this.Sut( name, {} )()
        ;

        this.assertEqual( anon.toString(), '#<anonymous>' );
        this.assertEqual( named.toString(), '#<' + name + '>' );
    },


    /**
     * In order to accommodate syntax such as extending classes, ease.js
     * supports staging class names. This will return an object that
     * operates exactly like the normal Class module, but will result in a
     * named class once the class is created.
     */
    'Can create named class using staging method': function()
    {
        var name   = 'Foo',
            named  = this.Sut( name ).extend( {} );

        // ensure what was returned is a valid class
        this.assertEqual(
            this.Sut.isClass( named ),
            true,
            "Named class generated via staging method is considered to " +
                "be a valid class"
        );

        // was the name set?
        this.assertEqual(
            named.toString(),
            name,
            "Name is set on named clas via staging method"
        );
    },


    /**
     * We should be able to continue to implement interfaces using the
     * staging method just as we would without it.
     */
    'Can implement interfaces using staging method': function()
    {
        var name      = 'Foo',
            Interface = this.require( 'interface' ),
            namedi    = this.Sut( name )
                .implement( Interface( {} ) )
                .extend( {} );

        // we should also be able to implement interfaces
        this.assertEqual(
            this.Sut.isClass( namedi ),
            true,
            "Named class generated via staging method, implementing an " +
                "interface, is considered to be a valid class"
        );

        this.assertEqual(
            namedi.toString(),
            name,
            "Name is set on named class via staging method when implementing"
        );
    },


    /**
     * Similarily, the extend method should retain its ability to extend
     * existing classes.
     */
    'Can extend existing classes using staging method': function()
    {
        var name   = 'Foo',
            named  = this.Sut( name ).extend( {} ),
            namede = this.Sut( name ).extend( named, {} );

        this.assertEqual( this.Sut.isClass( namede ), true );

        this.assertOk( this.Sut.isInstanceOf( named, namede() ) );
        this.assertEqual( namede.toString(), name );
    },


    /**
     * The class name should be provided in the error thrown when attempting
     * to instantiate an abstract class, if it's available
     */
    'Class name is given when attempting to instantiate abstract class':
    function()
    {
        var name = 'Foo';

        try
        {
            this.Sut( name, { 'abstract foo': [] } )();

            // we're not here to test to make sure it is thrown, but if it's
            // not, then there's likely a problem
            this.assertFail(
                "Was expecting instantiation error; there's a bug somewhere"
            );
        }
        catch ( e )
        {
            this.assertNotEqual(
                e.message.match( name ),
                null,
                "Abstract class instantiation error should contain " +
                    "class name"
            );
        }

        // if no name is provided, then (anonymous) should be indicated
        try
        {
            this.Sut( { 'abstract foo': [] } )();

            // we're not here to test to make sure it is thrown, but if it's
            // not, then there's likely a problem
            this.assertFail(
                "Was expecting instantiation error; there's a bug somewhere"
            );
        }
        catch ( e )
        {
            this.assertNotEqual(
                e.message.match( '(anonymous)' ),
                null,
                "Abstract class instantiation error should recognize " +
                    "that class is anonymous if no name was given"
            );
        }
    },
} );

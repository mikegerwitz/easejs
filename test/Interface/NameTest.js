/**
 * Tests interface naming
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
        this.Sut  = this.require( 'interface' );
        this.util = this.require( 'util' );
    },


    /**
     * Interfaces may be named by passing the name as the first argument to
     * the module
     */
    'Interface accepts name': function()
    {
        var _self = this;
        this.assertDoesNotThrow( function()
        {
            var iface = _self.Sut( 'Foo', {} );
            _self.assertOk( _self.Sut.isInterface( iface ) );
        }, Error );
    },


    /**
     * The interface definition, which equates to the body of the interface,
     * must be an object
     */
    'Named interface definition requires that definition be an object':
    function()
    {
        var name = 'Foo';

        try
        {
            this.Sut( name, 'Bar' );

            // if all goes well, we'll never get to this point
            this.assertFail(
                "Second argument to named interface must be the definition"
            );
        }
        catch ( e )
        {
            this.assertNotEqual(
                e.message.match( name ),
                null,
                "Interface definition argument count error string contains " +
                    "interface name"
            );
        }
    },


    /**
     * Extraneous arguments likely indicate a misunderstanding of the API
     */
    'Named interface definition is strict on argument count': function()
    {
        var name = 'Foo',
            args = [ name, {}, 'extra' ]
        ;

        // we should be permitted only two arguments
        try
        {
            this.Sut.apply( null, args );

            // we should not get to this line (an exception should be thrown due to
            // too many arguments)
            assert.fail(
                "Should accept only two arguments when creating named interface"
            );
        }
        catch ( e )
        {
            var errstr = e.message;

            this.assertNotEqual(
                errstr.match( name ),
                null,
                "Named interface error should provide interface name"
            );

            this.assertNotEqual(
                errstr.match( args.length + ' given' ),
                null,
                "Named interface error should provide number of given arguments"
            );
        }
    },


    /**
     * By default, anonymous interfacees should simply state that they are a
     * interface when they are converted to a string
     */
    'Converting anonymous interface to string yields generic string':
    function()
    {
        this.assertEqual(
            this.Sut( {} ).toString(),
            '[object Interface]'
        );
    },


    /**
     * If the interface is named, then the name should be presented when it
     * is converted to a string
     */
    'Converting named interface to string yields string containing name':
    function()
    {
        var name = 'Foo';

        this.assertEqual(
            this.Sut( name, {} ).toString(),
            '[object Interface <' + name + '>]'
        );
    },


    /**
     * If an interface name is available, then error messages should use it
     * to aid the developer in finding its origin.
     */
    'Declaration errors provide interface name if avaiable': function()
    {
        var Sut = this.Sut;

        var name = 'Foo',

            // functions used to cause the various errors
            tries = [
                // properties
                function()
                {
                    Sut( name, { prop: 'str' } );
                },

                // methods
                function()
                {
                    Sut( name, { method: function() {} } );
                },
            ]
        ;

        // if we have getter/setter support, add those to the tests
        if ( !( this.util.definePropertyFallback() ) )
        {
            // getter
            tries.push( function()
            {
                var obj = {};
                Object.defineProperty( obj, 'getter', {
                    get:        function() {},
                    enumerable: true,
                } );

                Sut( name, obj );
            } );

            // setter
            tries.push( function()
            {
                var obj = {};
                Object.defineProperty( obj, 'setter', {
                    set:        function() {},
                    enumerable: true,
                } );

                Sut( name, obj );
            } );
        }

        // gather the error strings
        var i = tries.length;
        while ( i-- )
        {
            try
            {
                // cause the error
                tries[ i ]();
            }
            catch ( e )
            {
                // ensure the error string contains the interface name
                this.assertNotEqual(
                    e.message.match( name ),
                    null,
                    "Error contains interface name when available (" + i + ")"
                );

                return;
            }

            // we shouldn't get to this point...
            this.assertFail( "Expected error. Something's wrong: " + i );
        }
    },


    /**
     * When attempting to instantiate an interface, the error message should
     * contain its name, if available.
     */
    'Interface name is included in instantiation error': function()
    {
        var name = 'Foo';

        try
        {
            // this should throw an exception (cannot instantiate interfaces)
            this.Sut( name )();

            // we should never get here
            this.assertFail( "Exception expected. There's a bug somewhere." );
        }
        catch ( e )
        {
            this.assertNotEqual(
                e.message.match( name ),
                null,
                "Interface name is included in instantiation error message"
            );
        }
    },
} );

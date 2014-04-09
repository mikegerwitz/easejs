/**
 * Tests util.getPropertyDescriptor
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
        this.Sut = this.require( 'util' );
        this.hasGetSet = !( this.Sut.definePropertyFallback() );
    },


    /**
     * If Object.getOwnPropertyDescriptor is provided by our environment, it
     * should be used by util; anything else we do is a workaround in the
     * event that this is missing.
     */
    'Should use Object.getOwnPropertyDescriptor if available': function()
    {
        if ( !( this.hasGetSet && Object.getOwnPropertyDescriptor ) )
        {
            this.skip();
        }

        this.assertStrictEqual(
            this.Sut.getOwnPropertyDescriptor,
            Object.getOwnPropertyDescriptor
        );
    },


    /**
     * This function should provide a boolean value indicating whether it
     * can traverse the prototype chain
     */
    'Indicates whether property chain traversal is possible': function()
    {
        var traversable = ( typeof Object.getPrototypeOf === 'function' );

        this.assertEqual(
            this.Sut.getPropertyDescriptor.canTraverse,
            traversable
        );
    },


    /**
     * We don't want tricksters to get funky with our system
     */
    'Traversable property is non-writable': function()
    {
        if ( !( this.hasGetSet && Object.getOwnPropertyDescriptor ) )
        {
            this.skip();
        }

        this.assertEqual(
            Object.getOwnPropertyDescriptor(
                this.Sut.getPropertyDescriptor, 'canTraverse'
            ).writable,
            false
        );
    },


    /**
     * The return value should mimic Object.getOwnPropertyDescriptor if
     * we're not having to traverse the prototype chain
     */
    'Acts as ES5 getOwnPropertyDescriptor when one level deep': function()
    {
        var obj   = { foo: 'bar' },
            desc1 = this.Sut.getOwnPropertyDescriptor( obj, 'foo' ),
            desc2 = this.Sut.getPropertyDescriptor( obj, 'foo' )
        ;

        this.assertDeepEqual( desc1, desc2 );
    },


    /**
     * If we *do* have to start traversing the prototype chain (which
     * Object.getOwnPropertyDescriptor() cannot do), then it should be as if
     * we called Object.getOwnPropertyDescriptor() on the object in the
     * prototype chain containing the requested property.
     */
    'Traverses the prototype chain when necessary': function()
    {
        if ( !( this.Sut.getPropertyDescriptor.canTraverse ) )
        {
            this.skip();
        }

        var proto = { foo: 'bar' },
            obj   = function() {}
        ;

        obj.prototype = proto;

        // to give ourselves the prototype chain (we don't want to set __proto__
        // because this test will also be run on pre-ES5 engines)
        var inst = new obj(),

            // get the actual descriptor
            expected = this.Sut.getOwnPropertyDescriptor( proto, 'foo' ),

            // attempt to gather the descriptor from the prototype chain
            given = this.Sut.getPropertyDescriptor( inst, 'foo' )
        ;

        this.assertDeepEqual( given, expected );
    },
} );

/**
 * Tests safety of class instances
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
        this.Sut = this.require( 'class' );
    },


    /**
     * Ensure that we're not getting/setting values of the prototype, which
     * would have disasterous implications (=== can also be used to test for
     * references, but this test demonstrates the functionality that we're
     * looking to ensure)
     */
    'Multiple instances of same class do not share array references':
    function()
    {
        var C    = this.Sut.extend( { arr: [] } ),
            obj1 = new C(),
            obj2 = new C();

        obj1.arr.push( 'one' );
        obj2.arr.push( 'two' );

        // if the arrays are distinct, then each will have only one element
        this.assertEqual( obj1.arr[ 0 ], 'one' );
        this.assertEqual( obj2.arr[ 0 ], 'two' );
        this.assertEqual( obj1.arr.length, 1 );
        this.assertEqual( obj2.arr.length, 1 );
    },


    /**
     * Same concept as above, but with objects instead of arrays.
     */
    'Multiple instances of same class do not share object references':
    function()
    {
        var C    = this.Sut.extend( { obj: {} } ),
            obj1 = new C(),
            obj2 = new C();

        obj1.obj.a = true;
        obj2.obj.b = true;

        this.assertEqual( obj1.obj.a, true );
        this.assertEqual( obj1.obj.b, undefined );

        this.assertEqual( obj2.obj.a, undefined );
        this.assertEqual( obj2.obj.b, true );
    },


    /**
     * Ensure that the above checks extend to subtypes.
     */
    'Instances of subtypes do not share property references': function()
    {
        var C2 = this.Sut.extend( { arr: [], obj: {} } ).extend( {} ),
            obj1 = new C2(),
            obj2 = new C2();

        this.assertNotEqual( obj1.arr !== obj2.arr );
        this.assertNotEqual( obj1.obj !== obj2.obj );
    },
} );

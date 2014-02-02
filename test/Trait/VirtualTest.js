/**
 * Tests virtual trait methods
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
    },


    /**
     * If a trait specifies a virtual method, then the class should expose
     * the method as virtual.
     */
    'Class inherits virtual trait method': function()
    {
        var expected = 'foobar';

        var T = this.Sut(
        {
            'virtual foo': function()
            {
                return expected;
            }
        } );

        var C = this.Class.use( T ).extend( {} );

        // ensure that we are actually using the method
        this.assertEqual( C().foo(), expected );

        // if virtual, we should be able to override it
        var expected2 = 'foobaz',
            C2;

        this.assertDoesNotThrow( function()
        {
            C2 = C.extend(
            {
                'override foo': function()
                {
                    return expected2;
                }
            } );
        } );

        this.assertEqual( C2().foo(), expected2 );
    },


    /**
     * Virtual trait methods should be treated in a manner similar to
     * abstract trait methods---a class should be able to provide its own
     * concrete implementation. Note that this differs from the above test
     * because we are overriding the method internally at definition time,
     * not subclassing.
     */
    'Class can override virtual trait method': function()
    {
        var _self = this;
        var T = this.Sut(
        {
            'virtual foo': function()
            {
                // we should never execute this (unless we're broken)
                _self.fail( true, false,
                    "Method was not overridden."
                );
            }
        } );

        var expected = 'foobar';
        var C = this.Class.use( T ).extend(
        {
            'override foo': function() { return expected; }
        } );

        this.assertEqual( C().foo(), expected );
    },
} );

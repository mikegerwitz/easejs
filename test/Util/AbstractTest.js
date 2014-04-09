/**
 * Tests util abstract functions
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
 * TODO: We are missing tests for various details such as ensuring that the
 * definition and parameter length are properly recorded.
 */

require( 'common' ).testCase(
{
    setUp: function()
    {
        this.Sut = this.require( 'util' );
    },


    /**
     * The purpose is to return a function that can be used as part of a
     * class definition.
     */
    'abstractMethod returns a function': function()
    {
        this.assertEqual(
            typeof this.Sut.createAbstractMethod(),
            'function'
        );
    },


    /**
     * We also expose a means of checking whether or not a given function is
     * abstract; this hides the implementation details.
     */
    'Returned function is considered abstract by isAbstractMethod':
    function()
    {
        this.assertOk(
            this.Sut.isAbstractMethod( this.Sut.createAbstractMethod() )
        );
    },


    'Abstract methods cannot be invoked': function()
    {
        var Sut = this.Sut;
        this.assertThrows( function()
        {
            Sut.createAbstractMethod()();
        }, Error );
    },
} );

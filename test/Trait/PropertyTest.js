/**
 * Tests trait properties
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
 * Or, rather, lack thereof, at least for the time being---this is something
 * that is complicated by pre-ES5 fallback and, while a solution is
 * possible, it is not performant in the case of a fallback and would muddy
 * up ease.js' code.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut = this.require( 'Trait' );
    },


    /**
     * Since private properties cannot be accessed by anything besides the
     * trait itself, they cannot interfere with anything else and should be
     * permitted. Indeed, it would be obsurd to think otherwise, since the
     * trait should be able to maintain its own local state.
     */
    'Private trait properties are permitted': function()
    {
        var Sut = this.Sut;
        this.assertDoesNotThrow( function()
        {
            Sut( { 'private _foo': 'bar' } );
        } );
    },


    /**
     * See the description at the top of this file. This is something that
     * may be addressed in future releases.
     *
     * Rather than simply ignoring them, we should notify the user that
     * their code is not going to work as intended and prevent bugs
     * associated with it.
     */
    'Public and protected trait properties are prohibited': function()
    {
        var Sut = this.Sut;

        this.assertThrows( function()
        {
            Sut( { 'public foo': 'bar' } );
        } );

        this.assertThrows( function()
        {
            Sut( { 'protected foo': 'bar' } );
        } );
    },
} );

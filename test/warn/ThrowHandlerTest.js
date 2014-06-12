/**
 * Tests throwing warning handler
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
        this.Sut     = this.require( 'warn/ThrowHandler' );
        this.Warning = this.require( 'warn/Warning' );
    },


    'Can be instantiated without `new` keyword': function()
    {
        this.assertOk( this.Sut() instanceof this.Sut );
    },


    /**
     * The wrapped error should be thrown as an exception; this effectively
     * undoes the warning wrapper.
     */
    '`throwError\' warning handler throws wrapped error': function()
    {
        var warn = this.Warning( Error( 'gninraw' ) );

        try
        {
            this.Sut().handle( warn );
        }
        catch ( e )
        {
            this.assertStrictEqual( e, warn.getError(),
                "Wrapped exception should be thrown"
            );

            return;
        }

        this.assertFail( "Wrapped exception should be thrown" );
    },
} );

/**
 * Tests warning system implementation
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

try { void console } catch ( e ) { console = undefined; }

require( 'common' ).testCase(
{
    setUp: function()
    {
        // XXX: this uses global state; remove that requirement.
        this.Sut = this.require( 'warn' );
    },


    /**
     * The default warning handler should be the 'log' handler; this is a
     * friendly compromise that will allow the developer to be warned of
     * potential issues without affecting program execution.
     */
    'Default warning handler is `log\'': function()
    {
        var called = false;

        // stub it
        this.Sut.setConsole( {
            warn: function()
            {
                called = true;
            },
        } );

        this.Sut.handle( this.Sut.Warning( Error( 'foo' ) ) );
        this.assertOk( called );

        // restore console (TODO: this will not be necessary once reliance
        // on global state is removed)
        this.Sut.setConsole( console );
    },


    /**
     * The warning handler can be altered at runtime; ensure we can set it
     * and call it appropriately. We do not need to use one of the
     * pre-defined handlers.
     */
    'Can set and call arbitrary warning handler': function()
    {
        var given,
            warning = this.Sut.Warning( Error( 'foo' ) );

        // set a stub warning handler
        this.Sut.setHandler( function( warn )
        {
            given = warn;
        } );

        // trigger the handler
        this.Sut.handle( warning );
        this.assertDeepEqual( given, warning );
    },
} );

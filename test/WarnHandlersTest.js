/**
 * Tests core warning handlers
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
    caseSetUp: function()
    {
        // XXX: this has global state
        this.Sut = this.require( 'warn' );
    },


    setUp: function()
    {
        this.stubwarn = this.Sut.Warning( Error( 'gninraw' ) );
    },


    /**
     * The log warning handler should log warnings to the console
     */
    '`log\' warning handler logs messages to console': function()
    {
        var _self  = this,
            logged = false;

        // mock console
        this.Sut.setConsole( {
            warn: function( message )
            {
                // should prefix with `Warning: '
                _self.assertEqual(
                    ( 'Warning: ' + _self.stubwarn.message ),
                    message
                );

                logged = true;
            },
        } );

        // call handler with the warning
        this.Sut.handlers.log( this.stubwarn );

        this.assertOk( logged, true,
            "Message should be logged to console"
        );

        // restore console (TODO: will not be necessary once global state is
        // removed)
        this.Sut.setConsole( console );
    },


    /**
     * Some environments may not have a console reference, or they may not
     * have console.warn. In this case, we just want to make sure we don't
     * throw an error when attempting to invoke undefined, or access a
     * property of undefined.
     */
    '`log\' warning handler handles missing console': function()
    {
        var Sut = this.Sut;

        // destroy it
        Sut.setConsole( undefined );

        // attempt to log
        var _self = this;
        this.assertDoesNotThrow( function()
        {
            Sut.handlers.log( _self.warnstub );
        } );

        // restore console
        Sut.setConsole( console );
    },


    /**
     * Furthermore, an environment may implement console.log(), but not
     * console.warn(). By default, we use warn(), so let's ensure we can
     * fall back to log() if warn() is unavailable.
     */
    '`log\' warning handler falls back to log if warn is missing':
    function()
    {
        var given = '';

        this.Sut.setConsole( {
            log: function( message )
            {
                given = message;
            }
        } );

        // attempt to log
        this.Sut.handlers.log( this.stubwarn );

        this.assertEqual( ( 'Warning: ' + this.stubwarn.message ), given,
            "Should fall back to log() and log proper message"
        );

        // restore console
        this.Sut.setConsole( console );
    },


    /**
     * The throwError warning handler should throw the wrapped error as an
     * exception
     */
    '`throwError\' warning handler throws wrapped error': function()
    {
        try
        {
            this.Sut.handlers.throwError( this.stubwarn );
        }
        catch ( e )
        {
            this.assertStrictEqual( e, this.stubwarn.getError(),
                "Wrapped exception should be thrown"
            );

            return;
        }

        this.assertFail( "Wrapped exception should be thrown" );
    },


    /**
     * The 'dismiss' error handler is a pretty basic concept: simply do
     * nothing. We don't want to log, we don't want to throw anything, we
     * just want to pretend nothing ever happened and move on our merry way.
     * This is intended for use in production environments where such
     * warnings are expected to already have been worked out and would only
     * confuse/concern the user.
     */
    '`dismiss\' warning handler does nothing': function()
    {
        var Sut = this.Sut;

        // destroy the console to ensure nothing is logged
        Sut.setConsole( undefined );

        // no errors should occur because it should not do anything.
        var _self = this;
        this.assertDoesNotThrow( function()
        {
            Sut.handlers.dismiss( _self.warnstub );
        } );

        // restore console
        Sut.setConsole( console );
    },
} );

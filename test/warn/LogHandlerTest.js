/**
 * Tests logging warning handler
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
        this.Sut     = this.require( 'warn/LogHandler' );
        this.Warning = this.require( 'warn/Warning' );
    },


    setUp: function()
    {
        this.stubwarn = this.Warning( Error( 'gninraw' ) );
    },


    'Can be instantiated without `new` keyword': function()
    {
        this.assertOk( this.Sut() instanceof this.Sut );
    },


    /**
     * Warnings should be logged to the provided console. By default, the
     * `warn` method is used (see below tests for fallbacks).
     */
    'Logs messages to console': function()
    {
        var _self  = this,
            logged = false;

        // mock console
        this.Sut( {
            warn: function( message )
            {
                // should prefix with `Warning: '
                _self.assertEqual(
                    ( 'Warning: ' + _self.stubwarn.message ),
                    message
                );

                logged = true;
            },
        } ).handle( this.stubwarn );

        this.assertOk( logged, true,
            "Message should be logged to console"
        );
    },


    /**
     * Some environments may not have a console reference, or they may not
     * have console.warn. In this case, we just want to make sure we don't
     * throw an error when attempting to invoke undefined, or access a
     * property of undefined.
     */
    'Ignores missing console': function()
    {
        var _self = this;
        this.assertDoesNotThrow( function()
        {
            _self.Sut( undefined ).handle( _self.warnstub );
        } );
    },


    /**
     * Furthermore, an environment may implement `console.log`, but not
     * `console.warn`. By default, we use `warn`, so let's ensure we can
     * fall back to `log` if `warn` is unavailable.
     */
    'Falls back to log if warn is missing': function()
    {
        var given = '';

        this.Sut( {
            log: function( message )
            {
                given = message;
            }
        } ).handle( this.stubwarn );

        this.assertEqual( ( 'Warning: ' + this.stubwarn.message ), given,
            "Should fall back to log() and log proper message"
        );
    },


    /**
     * If both `console.warn` and `console.log` are defined (which is very
     * likely to be the case), the former should take precedence.
     */
    '`warn` takes precedence over `log`': function()
    {
        var log = warn = false;

        this.Sut( {
            warn: function() { warn = true },
            log:  function() { log = true },
        } ).handle( this.stubwarn );

        this.assertOk( warn );
        this.assertOk( !log );
    },
} );

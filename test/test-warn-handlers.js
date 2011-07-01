/**
 * Tests core warning handlers
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 * @package test
 */

var common  = require( './common' ),
    assert  = require( 'assert' ),
    warn    = common.require( 'warn' ),
    Warning = warn.Warning,

    warning = Warning( Error( 'gninraw' ) )
;


/**
 * Return the console object, without throwing errors if it does not exist
 *
 * @return {Object} console
 */
function backupConsole()
{
    // ensure that we don't throw errors if console is not defined
    if ( typeof console !== 'undefined' )
    {
        return console;
    }

    return undefined;
}


/**
 * The log warning handler should log warnings to the console
 */
( function testLogWarningHandlerLogsMessageToConsole()
{
    var logged = false,

        // back up console ref
        console_ = backupConsole()
    ;

    // mock console
    console = {
        warn: function( message )
        {
            assert.equal( message, warning.message,
                "Should log proper message to console"
            );

            logged = true;
        },
    };

    // call handler with the warning
    warn.handlers.log( warning );

    assert.equal( logged, true,
        "Message should be logged to console"
    );

    // restore console
    console = console_;
} )();


/**
 * Some environments may not have a console reference, or they may not have
 * console.warn. In this case, we just want to make sure we don't throw an error
 * when attempting to invoke undefined, or access a property of undefined.
 */
( function testLogWarningHandlerHandlesMissingConsole()
{
    // back up console
    var console_ = backupConsole();

    // destroy it
    console = undefined;

    // attempt to log
    warn.handlers.log( warning );

    // restore console
    console = console_;
} )();


/**
 * Furthermore, an environment may implement console.log(), but not
 * console.warn(). By default, we use warn(), so let's ensure we can fall back
 * to log() if warn() is unavailable.
 */
( function testLogWarningHandlerWillFallBackToLogMethodIfWarnIsMissing()
{
    // back up and overwrite console to contain only log()
    var console_ = backupConsole(),
        given    = '';

    console = {
        log: function( message )
        {
            given = message;
        }
    };

    // attempt to log
    warn.handlers.log( warning );

    assert.equal( given, warning.message,
        "Should fall back to log() and log proper message"
    );

    // restore console
    console = console_;
} )();


/**
 * The throwError warning handler should throw the wrapped error as an exception
 */
( function testThrowErrorWarningHandlerThrowsWrappedError()
{
    try
    {
        warn.handlers.throwError( warning );
    }
    catch ( e )
    {
        assert.deepEqual( e, warning.getError(),
            "Wrapped exception should be thrown"
        );

        return;
    }

    assert.fail( "Wrapped exception should be thrown" );
} )();


/**
 * The 'dismiss' error handler is a pretty basic concept. Simply do nothing. We
 * don't want to log, we don't want to throw anything, we just want to pretend
 * nothing ever happened and move on our merry way. This is intended for use in
 * production environments where providing warnings may provide too much insight
 * into the software.
 */
( function testDismissWarningHandlerShouldDoNothing()
{
    // destroy the console to ensure nothing is logged
    var console_ = backupConsole();
    console = undefined;

    // don't catch anything, to ensure no errors occur and that no exceptions
    // are thrown
    warn.handlers.dismiss( warning );

    // restore console
    console = console_;
} )();


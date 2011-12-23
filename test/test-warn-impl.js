/**
 * Tests warning system implementation
 *
 *  Copyright (C) 2010,2011 Mike Gerwitz
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
 */

var common  = require( './common' ),
    assert  = require( 'assert' ),
    warn    = common.require( 'warn' )
;

if ( typeof console === 'undefined' ) console = undefined;


/**
 * The default warning handler should be the 'log' handler. This is a friendly
 * compromise that will allow the developer to be warned of potential issues
 * without affecting program execution.
 */
( function testDefaultHandlerIsLogger()
{
    var called   = false;

    // stub it
    warn.setConsole( {
        warn: function()
        {
            called = true;
        },
    } );

    warn.handle( warn.Warning( Error( 'foo' ) ) );

    assert.ok( called,
        "Default handler will log to console"
    );

    // restore console
    warn.setConsole( console );
} )();


/**
 * The warning handler can be altered at runtime. Ensure we can set it and call
 * it appropriately. We do not need to use one of the pre-defined handlers.
 */
( function testCanSetAndCallWarningHandler()
{
    var given,
        warning = warn.Warning( Error( 'foo' ) );

    // set a stub warning handler
    warn.setHandler( function( warn )
    {
        given = warn;
    } );

    // trigger the handler
    warn.handle( warning );

    assert.deepEqual( given, warning,
        "Set warning handler should be called with given Warning"
    );
} )();


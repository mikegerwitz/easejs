/**
 * ease.js warning system
 *
 *  Copyright (C) 2011, 2012, 2013 Free Software Foundation, Inc.
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

/**
 * Active warning handler
 * @type {?function( Warning )}
 */
var _handler = null;

/**
 * Console to use for logging
 *
 * This reference allows an alternative console to be used. Must contain warn()
 * or log() methods.
 *
 * @type {Object}
 */
var _console = ( typeof console !== 'undefined' ) ? console : undefined;


exports.Warning = require( './warn/Warning' );


/**
 * Core warning handlers
 * @type {Object}
 */
exports.handlers = {
    /**
     * Logs message to console
     *
     * Will attempt to log using console.warn(), falling back to console.log()
     * if necessary and aborting entirely if neither is available.
     *
     * This is useful as a default option to bring problems to the developer's
     * attention without affecting the control flow of the software.
     *
     * @param {Warning} warning to log
     *
     * @return {undefined}
     */
    log: function( warning )
    {
        var dest;

        _console && ( dest = _console.warn || _console.log ) &&
            dest.call( _console, ( 'Warning: ' + warning.message ) );
    },


    /**
     * Throws the error associated with the warning
     *
     * This handler is useful for development and will ensure that problems are
     * brought to the attention of the developer.
     *
     * @param {Warning} warning to log
     *
     * @return {undefined}
     */
    throwError: function( warning )
    {
        throw warning.getError();
    },


    /**
     * Ignores warnings
     *
     * This is useful in a production environment where (a) warnings will affect
     * the reputation of the software or (b) warnings may provide too much
     * insight into the software. If using this option, you should always
     * develop in a separate environment so that the system may bring warnings
     * to your attention.
     *
     * @param {Warning} warning to log
     *
     * @return {undefined}
     */
    dismiss: function( warning )
    {
        // do nothing
    },
};


/**
 * Sets the active warning handler
 *
 * You may use any of the predefined warning handlers or pass your own function.
 *
 * @param {function( Warning )} handler warning handler
 *
 * @return {undefined}
 */
exports.setHandler = function( handler )
{
    _handler = handler;
};


/**
 * Handles a warning using the active warning handler
 *
 * @param {Warning} warning warning to handle
 *
 * @return {undefined}
 */
exports.handle = function( warning )
{
    _handler( warning );
}


/**
 * Sets active console
 *
 * @param {Object} console containing warn() or log() method
 *
 * @return {undefined}
 */
exports.setConsole = function( console )
{
    _console = console;
};


// set the default handler
_handler = exports.handlers.log;


/**
 * ease.js warning system
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
 * @package core
 */


/**
 * Permits wrapping an exception as a warning
 *
 * Warnings are handled differently by the system, depending on the warning
 * level that has been set.
 *
 * @param {Error} e exception (error) to wrap
 *
 * @return {Warning} new warning instance
 */
var Warning = exports.Warning = function( e )
{
    // allow instantiation without use of 'new' keyword
    if ( !( this instanceof Warning ) )
    {
        return new Warning( e );
    }

    // ensure we're wrapping an exception
    if ( !( e instanceof Error ) )
    {
        throw TypeError( "Must provide exception to wrap" );
    }

    // copy over the message for convenience
    this.message = e.message;
    this._error  = e;
};

Warning.prototype = Error();


/**
 * Return the error wrapped by the warning
 *
 * @return {Error} wrapped error
 */
Warning.prototype.getError = function()
{
    return this._error;
};


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

        console && ( dest = console.warn || console.log ) &&
            dest( warning.message );
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


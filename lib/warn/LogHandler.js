/**
 * Logging warning handler
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


/**
 * Warning handler that logs all warnings to a console
 *
 * @param  {Object}  console  console with a warn or log method
 */
function LogHandler( console )
{
    if ( !( this instanceof LogHandler ) )
    {
        return new LogHandler( console );
    }

    this._console = console || {};
}


LogHandler.prototype = {
    /**
     * Handle a warning
     *
     * Will attempt to log using console.warn(), falling back to
     * console.log() if necessary and aborting entirely if neither is
     * available.
     *
     * This is useful as a default option to bring problems to the
     * developer's attention without affecting the control flow of the
     * software.
     *
     * @param   {Warning}   warning  warning to handle
     * @return  {undefined}
     */
    handle: function( warning )
    {
        var dest = this._console.warn || this._console.log;
        dest && dest.call( this._console,
            'Warning: ' + warning.message
        );
    },
}

module.exports = LogHandler;


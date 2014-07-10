/**
 * Dismissive warning handler
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
 * Warning handler that dismisses (ignores) all warnings
 *
 * This is useful in a production environment.
 */
function DismissiveHandler()
{
    if ( !( this instanceof DismissiveHandler ) )
    {
        return new DismissiveHandler();
    }
}


DismissiveHandler.prototype = {
    /**
     * Handle a warning
     *
     * @param   {Warning}   warning  warning to handle
     * @return  {undefined}
     */
    handle: function( warning )
    {
        // intentionally do nothing
    },
}

module.exports = DismissiveHandler;


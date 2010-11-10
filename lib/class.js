/**
 * Contains basic inheritance mechanism
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This program is free software: you can redistribute it and/or modify
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
 *
 * @author  Mike Gerwitz
 * @package core
 */


/**
 * Default class implementation
 *
 * @return undefined
 */
var Class = function()
{
};


exports.extend = function()
{
    Class.prototype.extend.apply( this, arguments );
}


Object.defineProperty( Class.prototype, 'extend',
{
    value: function()
    {
        var args  = Array.prototype.slice.call( arguments ),
            props = args.pop() || {},
            base  = args.pop() || Class;

        var prototype = new this();
    },

    enumerable:   false,
    writable:     false,
    configurable: false,
} );


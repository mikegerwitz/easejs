/**
 * Forward-compatible subset of ES6 Symbol for pre-ES6 environments
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
 *
 * This is *not* intended to be a complete implementation; it merely
 * performs what is needed for ease.js. In particular, this pre-ES6
 * implementation will simply generate a random string to be used as a key;
 * the caller is expected to add the key to the destination object as
 * non-enumerable, if supported by the environment.
 */

// ensures that, so long as these methods have not been overwritten by the
// time ease.js is loaded, we will maintain a proper reference
var _random = Math.random,
    _floor  = Math.floor;

// prefix used for all generated symbol strings (this string is highly
// unlikely to exist in practice); it will produce a string containing a
// non-printable ASCII character that is *not* the null byte
var _root = ' ' + String.fromCharCode(
    _floor( _random() * 10 ) % 31 + 1
) + '$';


/**
 * Generate a pseudo-random string (with a common prefix) to be used as an
 * object key
 *
 * The returned key is unique so long as Math.{random,floor} are reliable.
 * This will be true so long as (1) the runtime provides a reliable
 * implementation and (2) Math.{floor,random} have not been overwritten at
 * the time that this module is loaded. This module stores an internal
 * reference to this methods, so malicious code loaded after this module
 * will not be able to compromise the return value.
 *
 * Note that the returned string is not wholly random: a common prefix is
 * used to ensure that collisions with other keys on objects is highly
 * unlikely; you should not rely on this behavior, though, as it is an
 * implementation detail that may change in the future.
 *
 * @return  {string}  pseudo-random string with common prefix
 */
function FallbackSymbol()
{
    if ( !( this instanceof FallbackSymbol ) )
    {
        return new FallbackSymbol();
    }

    this.___$$id$$ = ( _root + _floor( _random() * 1e8 ) );
}


FallbackSymbol.prototype = {
    /**
     * Return random identifier
     *
     * This is convenient, as it allows us to both treat the symbol as an
     * object of type FallbackSymbol and use the symbol as a key (since
     * doing so will automatically call this method).
     *
     * @return  {string}  random identifier
     */
    toString: function()
    {
        return this.___$$id$$;
    },
};


module.exports = FallbackSymbol;


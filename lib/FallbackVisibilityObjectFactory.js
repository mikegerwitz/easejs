/**
 * Contains fallback visibility object factory
 *
 *  Copyright (C) 2010, 2011, 2013 Free Software Foundation, Inc.
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
 * Initializes fallback visibility object factory
 *
 * Unlike the standard visibility object, fallback does not create various
 * layers. This is for the simple fact that setting a value on one of the layers
 * is not visible to layers beneath it (its prototypes). Fallback is necessary
 * if proxy support or emulation (via ES5 getters/setters) is unavailable.
 */
module.exports = exports = function FallbackVisibilityObjectFactory()
{
    // permit omitting 'new' keyword
    if ( !( this instanceof exports ) )
    {
        // module.exports for Closure Compiler
        return new module.exports();
    }
};


/**
 * "Inherit" from VisibilityObjectFactory
 */
exports.prototype = require( './VisibilityObjectFactory' )();


/**
 * Do not create private visibility layer
 *
 * We're likely falling back because we cannot properly support the private
 * visibility layer. Therefore, it will be omitted.
 *
 * @param  {Object}  atop_of     will be returned, unmodified
 * @param  {Object}  properties  ignored
 *
 * @return  {Object}  provided object with no additional layer
 */
exports.prototype._createPrivateLayer = function( atop_of, properties )
{
    return atop_of;
};


/**
 * Does not create property proxy
 *
 * The fallback implementation is used because proxies are not supported and
 * cannot be emulated with getters/setters.
 *
 * @param  {Object}  base   will be returned, unmodified
 * @param  {Object}  dest   ignored
 * @param  {Object}  props  ignored
 *
 * @return  {Object}  given base
 */
exports.prototype.createPropProxy = function( base, dest, props )
{
    return base;
};


/**
 * Forward-compatible subset of ES6 Symbol
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
 * performs what is needed for ease.js, preferring the benefits of the ES6
 * Symbol implementation while falling back to sane ES5 and ES3 options.
 */

// to be used if there is no global Symbol available
var FallbackSymbol = require( './symbol/FallbackSymbol' );

var _root = require( './Global' ).expose();
module.exports = _root.Symbol || FallbackSymbol;


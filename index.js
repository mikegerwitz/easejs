/**
 * Provides ease of access to all submodules
 *
 *  Copyright (C) 2010, 2011, 2013, 2014, 2015 Free Software Foundation, Inc.
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
 * Wrap a prototype using ease.js
 *
 * This function is the entry point for ease.js; its fields expose all of
 * its core features.  When invoked, it wraps the given prototype using
 * ease.js, producing an ease.js Class.  This is more natural when using the
 * ECMAScript 6 `class` syntax to define prototypes.
 *
 * @param {Function} proto prototype to wrap
 *
 * @return {Function} ease.js Class wrapping PROTO
 */
var exports = module.exports = function( proto )
{
    return exports.Class.extend( proto, {} );
};

exports.Class         = require( './lib/class' );
exports.AbstractClass = require( './lib/class_abstract' );
exports.FinalClass    = require( './lib/class_final' );
exports.Interface     = require( './lib/interface' );
exports.Trait         = require( './lib/Trait' );
exports.version       = require( './lib/version' );

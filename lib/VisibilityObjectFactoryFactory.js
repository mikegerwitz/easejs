/**
 * Contains factory for visibility object factory
 *
 *  Copyright (C) 2011, 2013 Free Software Foundation, Inc.
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
 * XXX: Figure out how to resolve Closure Compiler's warning about shared
 * type information
 */

// XXX: Tightly coupled
var util = require( './util' ),

    VisibilityObjectFactory = require( './VisibilityObjectFactory' ),

    FallbackVisibilityObjectFactory =
        require( './FallbackVisibilityObjectFactory' )
;


/**
 * Responsible for instantiating the VisibilityObjectFactory appropriate for the
 * runtime environment
 *
 * This prototype determines what class should be instantiated. If we are within
 * an ECMAScript 5 environment, we can take full advantage of the standard
 * visibility object implementation. Otherwise, we are unable to emulate proxies
 * and must fall back on a less sophisticated implementation that sacrifices
 * visibility support.
 */
exports.fromEnvironment = function()
{
    // if falling back, return fallback, otherwise standard
    return ( util.definePropertyFallback() )
        ? FallbackVisibilityObjectFactory()
        : VisibilityObjectFactory()
    ;
};


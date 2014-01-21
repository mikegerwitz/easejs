/**
 * Tests util abstract functions
 *
 *  Copyright (C) 2010, 2011, 2013 Mike Gerwitz
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

var common = require( './common' ),
    assert = require( 'assert' ),
    util   = common.require( 'util' );


assert.ok(
    ( util.createAbstractMethod() instanceof Function ),
    "abstractMethod() returns a function"
);

assert.ok(
    ( util.isAbstractMethod( util.createAbstractMethod() ) ),
    "Functions returned by abstractMethod() are considered to be abstract by " +
        "util.isAbstractMethod"
);

assert['throws']( function()
{
    util.createAbstractMethod()();
}, Error, "Abstract methods cannot be called" );


/**
 * Tests Class class
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

require( './common' );

var assert = require( 'assert' ),
    Class  = require( 'class' );


assert.ok(
    ( Class.extend instanceof Function ),
    "Class module should provide an 'extend' method"
);


// create a basic test class
var Foo = Class.extend();


assert.ok(
    ( Foo instanceof Object ),
    "Extend method creates a new object"
);

assert.ok(
    ( Foo.prototype.extend instanceof Function ),
    "Created class contains extend method in prototype"
);

/**
 * Tests index.js
 *
 *  Copyright (C) 2010, 2011, 2013 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU General Public License as published by the Free Software
 *  Foundation, either version 3 of the License, or (at your option) any later
 *  version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 *  more details.
 *
 *  You should have received a copy of the GNU General Public License along with
 *  this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 */

var common = require( './common' ),
    assert = require( 'assert' ),

    Class         = common.require( 'class' ),
    AbstractClass = common.require( 'class_abstract' ),
    FinalClass    = common.require( 'class_final' ),
    Interface     = common.require( 'interface' ),
    version       = common.require( 'version' ),

    index  = require( '../' );


assert.ok(
    ( index.Class === Class ),
    "Class should be made available"
);

assert.ok(
    ( index.AbstractClass === AbstractClass ),
    "AbstractClass should be made available"
);

assert.ok(
    ( index.FinalClass === FinalClass ),
    "FinalClass should be made available"
);

assert.ok(
    ( index.Interface === Interface ),
    "Interface should be made available"
);

assert.ok( ( index.version === version ),
    "Version information should be exported"
);


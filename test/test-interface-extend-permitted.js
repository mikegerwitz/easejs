/**
 * Tests to ensure interfaces can only extend from interfaces
 *
 * Interface can extend from any object, so long as it only contains abstract
 * methods. However, the system checks for situations that don't make sense in
 * order to provide more meaningful error messages.
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 * @package test
 */

var common    = require( './common' ),
    assert    = require( 'assert' ),
    Class     = common.require( 'class' );
    Interface = common.require( 'interface' );


assert.throws( function()
{
    Interface.extend( Class.extend(), {} );
}, TypeError, "Interfaces cannot extend from classes" );


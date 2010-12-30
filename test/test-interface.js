/**
 * Tests interfaces
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

var common         = require( './common' ),
    assert         = require( 'assert' ),
    Interface      = common.require( 'interface' ),
    abstractMethod = Interface.abstractMethod;

var FooType = Interface.extend();


assert.ok(
    ( FooType instanceof Function ),
    "Interface extend method creates a new interface object"
);

assert.throws( function()
{
    new FooType();
}, Error, "Interfaces cannot be instantiated" );


// only perform check if supported by the engine
if ( Object.isFrozen )
{
    assert.equal(
        Object.isFrozen( FooType ),
        true,
        "Generated interface object should be frozen"
    );
}


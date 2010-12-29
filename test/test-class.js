/**
 * Tests class module object creation
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

var common = require( './common' ),
    assert = require( 'assert' ),
    Class  = common.require( 'class' );


assert.ok(
    ( Class.extend instanceof Function ),
    "Class module should provide an 'extend' method"
);


var Foo = Class.extend(
{
    value: 'foo',
});


assert.ok(
    ( Foo instanceof Object ),
    "Extend method creates a new object"
);

assert.ok(
    ( Class.isClass( Class.extend() ) ),
    "Classes are considered by the system to be classes"
);


//
// isClass
assert.ok(
    ( !( Class.isClass( {} ) ) ),
    "Only actual classes are considered to be classes"
);

assert.ok(
    ( !( Class.isClass( new Foo() ) ) ),
    "Class instances are not considered to be classes (they are objects)"
);


//
// isClassInstance
assert.ok(
    ( Class.isClassInstance( new Foo() ) ),
    "Class instances are considered to be classes instances"
);

assert.ok(
    ( !( Class.isClassInstance( Foo ) ) ),
    "Classes are not considered to be class instances"
);

assert.ok(
    ( !( Class.isClassInstance( {} ) ) ),
    "Other objects are not considered to be class instances"
);


// only perform check if supported by the engine
if ( Object.isFrozen )
{
    assert.equal(
        Object.isFrozen( Foo ),
        true,
        "Generated class should be frozen"
    );
}


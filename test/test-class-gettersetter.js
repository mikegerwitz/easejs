/**
 * Tests class getter/setter inheritance
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

// don't perform these tests if getters/setters are unsupported
if ( Object.prototype.__defineGetter__ === undefined )
{
    return;
}

require( './common' );

var assert = require( 'assert' ),
    Class  = require( 'class' );


var Foo = Class.extend(
{
    _foo: '',

    set foo( val )
    {
        this._foo = ''+( val );
    },

    get foo()
    {
        return this._foo;
    },

    set bar( val )
    {
    },

    get bar()
    {
        return 'durp';
    },
});

var SubFoo  = Foo.extend(
{
    bar2: null,

    set bar( val )
    {
        this.bar2 = val;
    },

    get bar()
    {
        return this.bar2;
    },
});

var foo = new Foo(),
    sub = new SubFoo(),
    val = 'val';


// ensure we have our act together before continuing
foo.foo = val;
assert.equal(
    foo.foo,
    val,
    "Sanity check"
);

// foo should be inherited as-is (if this doesn't work, someone went out of
// their way to break it, as it works by default!)
sub.foo = val = 'val2';
assert.equal(
    sub.foo,
    val,
    "Subtypes should inherit getter/setters"
);

sub.bar = val = 'val3';
assert.equal(
    sub.bar,
    val,
    "Subtypes should be able to override getter/setters"
);

assert.equal(
    sub.bar2,
    val,
    "Subtypes should be able to override getter/setters (check 2)"
);


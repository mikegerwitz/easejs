/**
 * Tests class getter/setter inheritance
 *
 *  Copyright (C) 2010, 2011, 2013 Mike Gerwitz
 *
 *  This file is part of GNU ease.js.
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
    Class  = common.require( 'class' ),
    util   = common.require( 'util' ),

    foo_def     = {},
    sub_foo_def = {}
;

// don't perform these tests if getters/setters are unsupported
if ( util.definePropertyFallback() )
{
    return;
}


// to prevent syntax errors in browsers that do not support getters/setters in
// object notation
Object.defineProperty( foo_def, 'foo', {
    get: function ()
    {
        return this._foo;
    },
    set: function ( val )
    {
        this._foo = ''+( val );
    },

    enumerable: true,
} );

Object.defineProperty( foo_def, 'virtual bar', {
    get: function ()
    {
        return 'durp';
    },
    set: function ( val )
    {
    },

    enumerable: true,
} );

Object.defineProperty( sub_foo_def, 'override bar', {
    get: function ()
    {
        return this.bar2;
    },
    set: function ( val )
    {
        this.bar2 = val;
    },

    enumerable: true,
} );

// this is important since the system may freeze the object, so we must have
// declared it in advance
foo_def.bar2 = '';


var Foo    = Class.extend( foo_def ),
    SubFoo = Foo.extend( sub_foo_def );

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


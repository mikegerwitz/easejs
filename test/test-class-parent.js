/**
 * Tests class parent invocation
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

require( './common' );

var assert = require( 'assert' ),
    Class  = require( 'class' );

var Foo = Class.extend(
{
    hitMethod:  false,
    hitMethod2: false,
    method2Arg: null,

    myMethod: function()
    {
        this.hitMethod = true;
        return this;
    },

    myMethod2: function( arg )
    {
        this.hitMethod2 = true;
        this.method2Arg = arg;

        return this;
    },
});

var SubFoo = Foo.extend(
{
    myMethod: function()
    {
        return this;
    },

    myMethod2: function( arg )
    {
        return this.__super( arg );
    },

    callParentAlt: function()
    {
        return this.parent.myMethod2.apply( this, arguments );
    },
});

var foo     = new Foo(),
    sub_foo = new SubFoo();

// make sure we're working properly before we run the important assertions
foo.myMethod().myMethod2();
assert.equal(
    foo.hitMethod,
    true,
    "Sanity check"
);
assert.equal(
    foo.hitMethod2,
    true,
    "Sanity check"
);

var arg = 'foobar';
sub_foo.myMethod().myMethod2( arg );

// myMethod overrides without calling parent
assert.equal(
    sub_foo.hitMethod,
    false,
    "Subtype should be able to override parent properties"
);

// myMethod2 overrides parent then calls super method
assert.equal(
    sub_foo.hitMethod2,
    true,
    "Subtype should be able to call parent method"
);

assert.equal(
    sub_foo.method2Arg,
    arg,
    "Arguments should be passed to super method via _super argument list"
);

assert.deepEqual(
    SubFoo.prototype.parent,
    Foo.prototype,
    "Parent property should represent parent prototype"
);

sub_foo.callParentAlt( arg = 'moo' );
assert.equal(
    sub_foo.method2Arg,
    arg,
    "The parent property may also be used to invoke parent methods"
);


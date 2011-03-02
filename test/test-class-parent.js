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

var common = require( './common' ),
    assert = require( 'assert' ),
    Class  = common.require( 'class' );

    // we store these outside of the class to ensure that visibility bugs do not
    // get in the way of our assertions
    hitMethod  = false,
    hitMethod2 = false,
    method2Arg  = null,

    Foo = Class.extend(
    {
        myMethod: function()
        {
            hitMethod = true;
            return this;
        },

        myMethod2: function( arg )
        {
            hitMethod2 = true;
            method2Arg = arg;

            return this;
        },
    }),

    SubFoo = Foo.extend(
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
    }),

    foo     = new Foo(),
    sub_foo = new SubFoo()
;

// make sure we're working properly before we run the important assertions
foo.myMethod().myMethod2();
assert.equal(
    hitMethod,
    true,
    "Sanity check"
);
assert.equal(
    hitMethod2,
    true,
    "Sanity check"
);

hitMethod = hitMethod2 = false;

var arg = 'foobar';
sub_foo.myMethod().myMethod2( arg );

// myMethod overrides without calling parent
assert.equal(
    hitMethod,
    false,
    "Subtype should be able to override parent properties"
);

// myMethod2 overrides parent then calls super method
assert.equal(
    hitMethod2,
    true,
    "Subtype should be able to call parent method"
);

assert.equal(
    method2Arg,
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
    method2Arg,
    arg,
    "The parent property may also be used to invoke parent methods"
);

assert.throws( function()
{
    Foo.extend(
    {
        // overriding method with scalar; shouldn't be allowed
        myMethod: 'scalar',
    });
}, TypeError, "Methods must be overridden with a Function" );


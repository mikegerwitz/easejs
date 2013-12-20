/**
 * Tests class parent invocation
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
    Class  = common.require( 'class' ),

    // we store these outside of the class to ensure that visibility bugs do not
    // get in the way of our assertions
    hitMethod  = false,
    hitMethod2 = false,
    hitDouble  = false,
    method2Arg  = null,

    Foo = Class.extend(
    {
        'virtual myMethod': function()
        {
            hitMethod = true;
            return this;
        },

        'virtual myMethod2': function( arg )
        {
            hitMethod2 = true;
            method2Arg = arg;

            return this;
        },

        'virtual double': function()
        {
            hitDouble = true;
        }
    }),

    SubFoo = Foo.extend(
    {
        'override myMethod': function()
        {
            return this;
        },

        'override myMethod2': function( arg )
        {
            return this.__super( arg );
        },

        'override double': function()
        {
            this.myMethod();
            this.__super();

            return this;
        }
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
sub_foo.myMethod().myMethod2( arg ).double();

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

assert['throws']( function()
{
    Foo.extend(
    {
        // overriding method with scalar; shouldn't be allowed
        myMethod: 'scalar',
    });
}, TypeError, "Methods must be overridden with a Function" );

// ensure that __super is not cleared after a call to an override
assert.equal(
    hitDouble,
    true,
    "__super is maintained in a stack-like manner"
);

/**
 * Tests util.propCopy
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

var common   = require( './common' ),
    assert   = require( 'assert' ),
    propCopy = common.require( 'util' ).propCopy;

    get_set = ( Object.prototype.__defineGetter__ ) ? true : false;

    props = {
        one: 1,
        two: 2,

        method: function two() {},
    },
    dest  = {}
;

if ( get_set )
{
    props.__defineGetter__( 'val', function () {} );
    props.__defineSetter__( 'val', function () {} );
}

propCopy( props, dest );
assert.ok(
    ( ( dest.one === props.one ) && ( dest.two === props.two ) ),
    "All properties should be copied to the destination object"
);

var each     = false,
    prop     = false,
    method   = false,
    getter   = false,
    setter   = false,
    override = false,

    override_data = [];

var test_val          = 'foobar',
    dest2_orig_method = function() { return test_val; };

var dest2 = {
    // will cause methodOverride action to be invoked
    method: dest2_orig_method,
};

propCopy( props, dest2, {
    each: function foo()
    {
        each = this.performDefault;
    },

    property: function()
    {
        prop = this.performDefault;
    },

    method: function( name, func )
    {
        // perform default action to ensure methodOverride() is called
        ( method = this.performDefault )( name, func );
    },

    getter: function()
    {
        getter = this.performDefault;
    },

    setter: function()
    {
        setter = this.performDefault;
    },

    methodOverride: function( name, pre, func )
    {
        override      = this.performDefault;
        override_data = [ name, pre, func ];
    },
} );

var check   = [ each, prop, method, override ],
    check_i = check.length,
    item    = null
;

if ( get_set )
{
    check.push( getter );
    check.push( setter );
}

while ( check_i-- )
{
    item = check[ check_i ];

    assert.notEqual(
        item,
        false,
        "Can override propCopy() parser functions [" + check_i + "]"
    );

    assert.ok(
        ( item instanceof Function ),
        "propCopy() parser function overrides can invoke default " +
            "functionality [" + check_i + "]"
    );
}

assert.ok(
    ( override_data[ 0 ] === 'method' ),
    "methodOverride action is passed correct method name"
);

assert.ok(
    ( override_data[ 1 ]() === test_val ),
    "methodOverride action is passed correct original function"
);

assert.ok(
    ( override_data[ 2 ] === props.method ),
    "methodOverride action is passed correct override function"
);


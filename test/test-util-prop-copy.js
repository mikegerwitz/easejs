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

require( './common' );

var assert   = require( 'assert' ),
    propCopy = require( '../lib/util' ).propCopy;

var props = {
    one: 1,
    two: 2,

    method: function() {},

    get val() {},
    set val() {},
};

var dest = {};

propCopy( props, dest );
assert.ok(
    ( ( dest.one === props.one ) && ( dest.two === props.two ) ),
    "All properties should be copied to the destination object"
);

var each   = false,
    prop   = false,
    method = false,
    getter = false,
    setter = false;

propCopy( props, dest, null, {
    each: function foo()
    {
        each = this.performDefault;
    },

    property: function()
    {
        prop = this.performDefault;
    },

    method: function()
    {
        method = this.performDefault;
    },

    getter: function()
    {
        getter = this.performDefault;
    },

    setter: function()
    {
        setter = this.performDefault;
    },
} );

[ each, prop, method, getter, setter ].forEach( function( item, i )
{
    assert.notEqual(
        item,
        false,
        "Can override propCopy() parser functions [" + i + "]"
    );

    assert.ok(
        ( item instanceof Function ),
        "propCopy() parser function overrides can invoke default functionality " +
            "[" + i + "]"
    );
});


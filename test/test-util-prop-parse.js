/**
 * Tests util.propParse
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
    util   = require( '../lib/util' );

var data = {
    // scalars (properties)
    propStr:  'string',
    propBool:  true,
    propInt:   1,
    propFloat: 1.23,

    // array (property)
    propArray: [],

    // object (property)
    propObj: {},

    // concrete method
    method: function() {},

    // abstract method
    abstractMethod: util.createAbstractMethod(),
};


var props    = {},
    methods  = {},
    amethods = {};

util.propParse( data, {
    property: function( name, value )
    {
        props[ name ] = value;
    },

    // concrete method
    method: function( name, method )
    {
        methods[ name ] = method;
    },

    abstractMethod: function( name, def )
    {
        amethods[ name ] = def;
    }
} );


// ensure properties were properly recognized
[ 'propStr', 'propBool', 'propInt', 'propFloat', 'propArray', 'propObj' ]
    .forEach( function( item )
    {
        assert.equal(
            props[ item ],
            data[ item ],
            "Property parser properly detects class properties"
        );
    });

assert.equal(
    methods.method,
    data.method,
    "Property parser properly detects concrete methods"
);

assert.equal(
    amethods.abstractMethod,
    data.abstractMethod,
    "Property parser properly detects abstract methods"
);


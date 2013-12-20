/**
 * Tests util.propParse
 *
 *  Copyright (C) 2010, 2011, 2012, 2013 Mike Gerwitz
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
    util   = common.require( 'util' ),

    get_set = !( util.definePropertyFallback() )
;

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

    // proxy
    'proxy someProxy': 'dest',
};

get_called = false;

// only add getter/setter if it's supported by our engine
if ( get_set )
{
    Object.defineProperty( data, 'someFoo', {
        get: function () { get_called = true; },
        set: function () {},

        enumerable: true,
    } );
}


var chk_each = {};
for ( var i in data )
{
    chk_each[ i ] = 1;
}


var props    = {},
    methods  = {},
    amethods = {},
    getters  = {},
    setters  = {};

util.propParse( data, {
    // run for each item in data
    each: function( name, value )
    {
        // only remove if the passed value is correct (note the check for
        // 'someFoo', since this has a getter and checking its value would
        // invoke the getter, which would taint one of the tests)
        if ( ( name === 'someFoo' ) || ( value === data[ name ] ) )
        {
            delete chk_each[ name ];
        }

        // TODO: Odd case. Perhaps this doesn't belong here or we can rewrite
        // this test.
        if ( name === 'someProxy' )
        {
            delete chk_each[ 'proxy someProxy' ];
        }
    },

    property: function( name, value )
    {
        props[ name ] = value;
    },

    method: function( name, method, is_abstract )
    {
        var to = ( is_abstract ) ? amethods : methods;
        to[ name ] = method;
    },

    getset: function( name, get, set )
    {
        getters[ name ] = get;
        setters[ name ] = set;
    },
} );


// ensure properties were properly recognized
var chk = [
        'propStr', 'propBool', 'propInt', 'propFloat', 'propArray', 'propObj'
    ],

    chk_i = chk.length,
    item  = null
;

while ( chk_i-- )
{
    item = chk[ chk_i ];

    assert.equal(
        props[ item ],
        data[ item ],
        "Property parser properly detects class properties"
    );
};

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

if ( get_set )
{
    assert.equal(
        getters.someFoo,
        data.__lookupGetter__( 'someFoo' ),
        "Property parser properly detects getters"
    );

    assert.equal(
        setters.someFoo,
        data.__lookupSetter__( 'someFoo' ),
        "Property parser properly detects setters"
    );

    // bug fix
    assert.equal( false, get_called,
        "Getter should not be called during processing"
    );
}


var chk_each_count = 0;
for ( var item in chk_each )
{
    chk_each_count++;
}

assert.equal(
    chk_each_count,
    0,
    "Property parser supports passing each property to the provided function"
);


var Foo = function() {};
Foo.prototype.one = 1;

var instance = new Foo();
instance.two = 2;

var count = 0;
util.propParse( instance, {
    each: function()
    {
        count++;
    },
} );

assert.equal(
    count,
    1,
    "propParse should ignore prototype properties of instances"
);


/**
 * At this point in time, we are unsure what we will allow within abstract
 * member declarations in the future (e.g. possible type hinting). As such, we
 * will simply allow only valid variable names for now (like a function
 * definition).
 */
( function testTriggersErrorIfInvalidVarNamesAreUsedAsParameterNames()
{
    assert['throws']( function()
    {
        util.propParse( { 'abstract foo': [ 'invalid name' ] }, {} );
    }, SyntaxError, 'Only var names should be permitted in interface dfns' );

    assert['throws']( function()
    {
        util.propParse( { 'abstract foo': [ '1invalid' ] }, {} );
    }, SyntaxError, 'Only var names should be permitted in interface dfns: 2' );

    assert.doesNotThrow( function()
    {
        util.propParse( { 'abstract foo': [ 'valid_name' ] }, {} );
    }, SyntaxError, 'Valid var names as args should not throw exceptions' );
} )();


/**
 * Proxies, since their values are strings, would conventionally be considered
 * properties. Therefore, we must ensure that the `proxy' keyword is properly
 * applied to return a method rather than a property.
 */
( function testProxiesAreConsideredMethodsDespiteTheirStringValues()
{
    assert.equal(
        methods.someProxy,
        data[ 'proxy someProxy' ],
        "Properties with `proxy' keyword should be considered to be methods"
    );
} )();


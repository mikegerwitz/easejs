/**
 * Tests amount of time taken defining and invoking methods passing through
 * traits
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Contrast with respective class test.
 */

var common    = require( __dirname + '/common.js' ),
    Trait     = common.require( 'Trait' ),
    Class     = common.require( 'class' ),
    Interface = common.require( 'interface' ),

    count = 1000
;


var I = Interface(
{
    a: [],
    b: [],
    c: [],
} );


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Trait(
         {
            a: function() {},
            b: function() {},
            c: function() {},
         } );
    }

}, count,
'Declare ' + count + ' empty anonymous traits with few concrete methods' );


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Trait(
         {
            'virtual a': function() {},
            'virtual b': function() {},
            'virtual c': function() {},
         } );
    }

}, count,
'Declare ' + count + ' empty anonymous traits with few virtual methods' );


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Trait(
         {
            'abstract a': [],
            'abstract b': [],
            'abstract c': [],
         } );
    }

}, count,
'Declare ' + count + ' empty anonymous traits with few abstract methods' );


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Trait.implement( I ).extend( {} );
    }

}, count,
'Declare ' + count + ' empty anonymous traits implementing interface ' +
    'with few methods' );


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Trait.implement( I ).extend(
         {
            'abstract override a': function() {},
            'abstract override b': function() {},
            'abstract override c': function() {},
         } );
    }

}, count,
'Declare ' + count + ' empty anonymous traits with few ' +
    'abstract overrides, implementing interface' );

/**
 * Tests amount of time taken to declare N classes mixing in traits of
 * various sorts
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

// we don't care about declare time; we're testing mixin time
var Te = Trait( {} );

var Tv = Trait(
{
    'virtual a': function() {},
    'virtual b': function() {},
    'virtual c': function() {},
} );

var I = Interface(
{
    a: [],
    b: [],
    c: [],
} );
var Cv = Class.implement( I ).extend(
{
    'virtual a': function() {},
    'virtual b': function() {},
    'virtual c': function() {},
} );

var To = Trait.implement( I ).extend(
{
    'virtual abstract override a': function() {},
    'virtual abstract override b': function() {},
    'virtual abstract override c': function() {},
} );



common.test( function()
{
    var i = count;

    while ( i-- )
    {
         // extend to force lazy mixin
         Class.use( Te ).extend( {} );
    }

}, count, 'Mix in ' + count + ' empty traits' );


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         // extend to force lazy mixin
         Class.use( Tv ).extend( {} );
    }

}, count, 'Mix in ' + count + ' traits with few virtual methods' );


// now override 'em
common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Class.use( Tv ).extend(
         {
            'override virtual a': function() {},
            'override virtual b': function() {},
            'override virtual c': function() {},
         } );
    }

}, count, 'Mix in and override ' + count +
    ' traits with few virtual methods' );


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Cv.use( To ).extend( {} );
    }

}, count, 'Mix in trait that overrides class methods' );

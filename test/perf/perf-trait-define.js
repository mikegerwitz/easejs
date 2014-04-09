/**
 * Tests amount of time taken to declare N anonymous traits
 *
 *  Copyright (C) 2010, 2011, 2013, 2014 Free Software Foundation, Inc.
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

var common = require( __dirname + '/common.js' ),
    Trait  = common.require( 'Trait' ),

    count = 1000
;


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Trait( {} );
    }

}, count, 'Declare ' + count + ' empty anonymous traits' );

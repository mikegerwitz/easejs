/**
 * Tests amount of time taken to instantiate named classes
 *
 *  Copyright (C) 2010, 2011, 2013 Free Software Foundation, Inc.
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
 */

var common = require( __dirname + '/common.js' ),
    Class  = common.require( 'class' )

    count = 5000,
    Foo   = Class( 'Foo', {} )
;

common.test( function()
{
    var i = count;

    while ( i-- )
    {
        // to be extra confident that V8 or another compiler won't realize this
        // is useless and optimize it out
        Foo();
    }

}, count, 'Instantiate ' + count + ' empty named classes' );

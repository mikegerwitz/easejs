/**
 * Tests amount of time taken to declare 1000 classes with a few members,
 * private keyword
 *
 *  Copyright (C) 2011 Mike Gerwitz
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


var common = require( __dirname + '/common.js' ),
    Class  = common.require( 'class' )

    count = 1000
;


common.test( function()
{
    var i = count;

    while ( i-- )
    {
         Class( {
            'private a': function() {},
            'private b': function() {},
            'private c': function() {},
         } );
    }

}, count, 'Declare ' + count + ' anonymous classes with private members' );

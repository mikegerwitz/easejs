/**
 * Common performance testing functionality
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
 * @package performance
 */

/**
 * Stores start time
 * @type  {number}
 */
var start = 0;


/**
 * Includes a module from the lib directory
 *
 * @param  {string}  name  module name
 *
 * @return  {Object}  module exports
 */
exports.require = function( name )
{
    return require( '../../lib/' + name );
};


/**
 * A simple wrapper to perform testing and output the result
 *
 * @param  {function()}  test  performance test to perform
 * @param  {string=}     desc  test description
 *
 * @return  {undefined}
 */
exports.test = function( test, desc )
{
    exports.start();
    test();
    exports.report( desc );
};


/**
 * Starts the timer
 *
 * @return  {undefined}
 */
exports.start = function()
{
    start = ( new Date() ).getTime();
};


/**
 * Outputs the time elapsed, followed by the description (if available)
 *
 * @param  {string=}  desc  test description
 *
 * @return  {undefined}
 */
exports.report = function( desc )
{
    desc = desc || '';

    var end   = ( new Date() ).getTime(),
        total = ( ( end - start ) / 1000 ).toFixed( 3 )
    ;

    console.log( total + 's' +
        ( ( desc ) ? ( ': ' + desc ) : '' )
    );
};


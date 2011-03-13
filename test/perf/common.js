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
 * The count is not used to call the function multiple times, because that would
 * greatly impact the test results. Instead, you should pass the number of times
 * the test was performed in a loop.
 *
 * @param  {function()}  test   performance test to perform
 * @param  {number}      count  number of times the test was performed
 * @param  {string=}     desc   test description
 *
 * @return  {undefined}
 */
exports.test = function( test, count, desc )
{
    exports.start();
    test();
    exports.report( count, desc );
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
 * @param  {number}   count  number of times the test was performed
 * @param  {string=}  desc   test description
 *
 * @return  {undefined}
 */
exports.report = function( count, desc )
{
    count = +count;
    desc  = desc || '';

    var end   = ( new Date() ).getTime(),
        total = ( ( end - start ) / 1000 ).toFixed( 3 ),
        pers  = ( total / count ).toFixed( 10 )
    ;

    console.log( total + "s (x" + count + " = " + pers + "s each)" +
        ( ( desc ) ? ( ': ' + desc ) : '' )
    );
};


/**
 * Runs test suite
 *
 * This script must be fed the tests to be run as arguments, one test case per
 * argument. All test cases should use common.testCase().
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
 */

var common = require( 'common' );

// start the test suite to defer statistics and failure output until the end of
// all test cases
common.testCase.startSuite();

// run each file provided to us
process.argv.forEach( function( val, i )
{
    // first arg is 'node', second is 'runner.js'
    if ( i < 2 )
    {
        return;
    }

    // the tests will run themselves; we need only require 'em
    require( __dirname + '/' + val );
} );

// output statistics
common.testCase.endSuite();


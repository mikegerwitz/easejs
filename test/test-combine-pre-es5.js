/**
 * Tests combined file, attempting to emulate a pre-ECMAScript5 environment.
 * This will ensure fallbacks will work properly on older browsers, such as IE6.
 *
 * This is /not/ an alternative to running the test suite in the browser of your
 * choice. It is intended to catch errors early, to ensure bugs are not
 * committed between browser tests.
 *
 *  Copyright (C) 2011, 2013 Mike Gerwitz
 *
 *  This file is part of GNU ease.js.
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

var common  = require( './common' ),
    assert  = require( 'assert' ),
    vm      = require( 'vm' ),
    Class   = common.require( 'class' ),

    // sandbox in which combined script will be run
    sandbox = vm.createContext( {
        // stub document.write() so we don't blow up
        document: { write: function() {} },
        runTests: null,
    } );


var file = 'ease-full.js';

// attempt to read the combined file
try
{
    var data = require( 'fs' )
        .readFileSync( ( __dirname + '/../build/' + file ), 'ascii' );
}
catch ( e )
{
    // if the file doesn't exit, just skip the test
    console.log(
        "Combined file not found. Test skipped. Please run `make combined`."
    );
    process.exit( 0 );
}

// Let's take this bitch back in time (this is not a complete list, but
// satisfies what we need).
//
// It is important to note that we prepend this to the script that we'll be
// executing, because the script will be executed within a new scope. Any
// clobbering we do in our scope will not affect it, nor will any clobbering we
// do to it affect us.
data = "delete Object.defineProperty;" +
    "delete Array.prototype.forEach;" +
    data
;

// run the script (if this fails to compile, the generated code is invalid)
vm.runInNewContext( data, sandbox );

// cross your fingers
sandbox.easejs.runTests();


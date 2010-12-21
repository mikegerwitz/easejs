/**
 * Tests combined file (basic evaluation)
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
 * @package test
 */

require( './common' );

var assert  = require( 'assert' ),
    Class   = require( 'class' ),
    Script  = process.binding( 'evals' ).Script,
    sandbox = {};

// attempt to read the combined file
try
{
    var data = require( 'fs' )
        .readFileSync( ( __dirname + '/../build/ease.js' ), 'ascii' );
}
catch ( e )
{
    // if the file doesn't exit, just skip the test
    console.log(
        "Combined file not found. Test skipped. Please run `make combined`."
    );
    process.exit( 0 );
}

// run the script (if this fails to compile, the generated code is invalid)
var cmb_script = new Script( data );
cmb_script.runInNewContext( sandbox );

assert.equal(
    sandbox.require,
    undefined,
    "require() function is not in the global scope"
);

assert.equal(
    sandbox.exports,
    undefined,
    "exports are not in the global scope"
);


assert.ok(
    ( sandbox.easejs !== undefined ),
    "'easejs' namespace is defined within combined file"
);

assert.ok(
    ( sandbox.easejs.Class !== undefined ),
    "easejs namespace contains class exports"
);


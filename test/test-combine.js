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
 */

var common  = require( './common' ),
    assert  = require( 'assert' ),
    vm      = require( 'vm' ),
    Class   = common.require( 'class' ),

    // sandbox in which combined script will be run
    sandbox = {
        // stub document.write() so we don't blow up
        document: { write: function() {} },
    };


// test all combined files, including minified files
var files = [ 'ease.js', 'ease-full.js'],
    file  = '',
    i     = files.length;

while ( i-- )
{
    file = files[ i ];

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
            "Combined/minified file not found. Test skipped. Please run " +
            "`make min`."
        );
        process.exit( 0 );
    }

    // run the script (if this fails to compile, the generated code is invalid)
    vm.runInNewContext( data, sandbox );

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

    [
        'Class',
        'AbstractClass',
        'FinalClass',
        'Interface',
        'version'
    ] .forEach( function( item )
    {
        assert.ok(
            sandbox.easejs[ item ],
            "Combined file exports exposes " + item
        );
    } );

    // the full file has tests included to be run client-side
    if ( file.match( /ease-full/ ) )
    {
        assert.ok(
            ( typeof sandbox.easejs.runTests === 'function' ),
            "Full ease.js file contains test runner"
        );

        // cross your fingers
        sandbox.easejs.runTests();
    }
}


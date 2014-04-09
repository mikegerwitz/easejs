/**
 * Tests combined file, attempting to emulate a pre-ECMAScript5 environment.
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
 * Node.js is required to run this case.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.fs = require( 'fs' );
        this.vm = require( 'vm' );
    },


    setUp: function()
    {
        // sandbox in which combined script will be run
        this.sandbox = this.vm.createContext( {
            // stub document.write() so we don't blow up
            document: { write: function() {} },
            runTests: null,
        } );
    },


    /**
     * This will ensure fallbacks will work properly on older browsers, such
     * as IE6--8.
     *
     * This is /not/ an alternative to running the test suite in the browser
     * of your choice; it is intended to catch errors early, to ensure bugs
     * are not committed between browser tests.
     */
    'All test cases run in a poorly-emulated pre-ES5 environment':
    function()
    {
        var file = 'ease-full.js';

        // attempt to read the combined file
        try
        {
            var data = this.fs.readFileSync(
                ( __dirname + '/../build/' + file ),
                'ascii'
            );
        }
        catch ( e )
        {
            this.skip();
        }

        // Let's take this bitch back in time (this is not a complete list,
        // but satisfies what we need).
        //
        // It is important to note that we prepend this to the script that
        // we'll be executing, because the script will be executed within a
        // new scope. Any clobbering we do in our scope will not affect it,
        // nor will any clobbering we do to it affect us.
        data = "delete Object.defineProperty;" +
            "delete Array.prototype.forEach;" +
            data
        ;

        // run the script (if this fails to compile, the generated code is
        // invalid)
        this.vm.runInNewContext( data, this.sandbox );

        // cross your fingers
        this.sandbox.easejs.runTests();
        this.assertOk( true );
    },
} );

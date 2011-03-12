/**
 * Tests amount of time taken to invoke Class methods
 *
 * Results are assigned to a var to ensure V8 doesn't optimize the calls too
 * much.
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


var common = require( __dirname + '/common.js' ),
    Class  = common.require( 'class' ),

    count = 500000,

    // used to ensure v8 doesn't optimize functions away
    i = 0,

    // instance of anonymous class
    foo = Class( {
        'public pub':     function() { i++; },
        'protected prot': function() { i++; },
        'private priv':   function() { i++; },

        'public testInternal': function()
        {
            var _self = this;

            common.test( function()
            {
                var i   = count;

                while ( i-- )
                {
                    _self.pub();
                }
            }, count, 'Invoke public methods internally' );


            common.test( function()
            {
                var i   = count;

                while ( i-- )
                {
                    _self.prot();
                }
            }, count, 'Invoke protected methods internally' );


            common.test( function()
            {
                var i   = count;

                while ( i-- )
                {
                    _self.priv();
                }
            }, count, 'Invoke private methods internally' );
        },
    } )()
;


common.test( function()
{
    var i   = count;

    while ( i-- )
    {
        foo.pub();
    }

}, count, 'Invoke public methods externally' );


// run the same test internally
foo.testInternal();


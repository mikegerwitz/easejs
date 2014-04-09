/**
 * Tests amount of time taken to declare read properties internally and
 * externally
 *
 *  Copyright (C) 2011, 2013 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.

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
    Class  = common.require( 'class' ),

    // we need many tests for a measurable result
    count = 500000

    // instance of anonymous class
    foo = Class( {
        'public  pub_bar':    'foo',
        'protected prot_bar': 'bar',
        'private priv_bar':   'baz',

        'public testInternal': function()
        {
            var _self = this;

            common.test( function()
            {
                var i   = count,
                    val = null
                ;

                while ( i-- )
                {
                    val = _self.pub_bar;
                }
            }, count, 'Read public properties internally' );


            common.test( function()
            {
                var i   = count,
                    val = null
                ;

                while ( i-- )
                {
                    val = _self.prot_bar;
                }
            }, count, 'Read protected properties internally' );


            common.test( function()
            {
                var i   = count,
                    val = null
                ;

                while ( i-- )
                {
                    val = _self.priv_bar;
                }
            }, count, 'Read private properties internally' );
        },
    } )()
;


common.test( function()
{
    var i   = count,
        val = null
    ;

    while ( i-- )
    {
        val = foo.pub_bar;
    }

}, count, 'Read public properties externally' );


// run the same test internally
foo.testInternal();


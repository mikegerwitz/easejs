/**
 * Tests amount of time taken to invoke Class methods
 *
 * The expected results are as follows:
 *   - Method invocations are expected to be slower than invoking a method on a
 *     conventional constructor instance. This is because of the method wrapper
 *     used by ease.js.
 *   - Public methods externally should be invoked very quickly. They are part
 *     of the class's prototype and therefore easily accessible.
 *   - Public methods /internally/ are likely to be invoked slightly more
 *     slowly. This is because it takes one extra step down the prototype chain
 *     to access them. The difference should be minute.
 *   - Protected and private methods internally should be accessed fairly
 *     quickly since, like public methods externally, they are first on the
 *     prototype chain.
 *     - Protected members will be accessed more slowly than private members,
 *       because they are one step lower on the prototype chain. Future versions
 *       will remove this performance hit if the Class contains no private
 *       members.
 *
 *  Copyright (C) 2011, 2013 Free Software Foundation, Inc.
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


// allows us to compare private method invocation times with method
// invocations on a conventional prototype (the increment of `i` is to
// ensure that the function is not optimized away)
( function()
{
    var p = function() {};
    p.prototype.foo = function() { i++ };
    var o = new p();

    common.test( function()
    {
        var i = count;
        while ( i-- ) o.foo();
    }, count, '[baseline] Invoke method on prototype' );
} )();


// compare with plain old function invocation
( function()
{
    var f = function() { i++ };
    common.test( function()
    {
        var i = count;
        while ( i-- ) f();
    }, count, '[baseline] Invoke function' );
} )();


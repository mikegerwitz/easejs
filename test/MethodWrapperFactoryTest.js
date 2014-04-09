/**
 * Tests MethodWrapperFactory prototype
 *
 *  Copyright (C) 2011, 2012, 2013 Free Software Foundation, Inc.
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

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut = this.require( 'MethodWrapperFactory' );
    },


    /**
     * To keep with the spirit of ease.js, we should be able to instantiate
     * MethodWrapperFactory both with and without the 'new' keyword
     *
     * Consistency is key with these sorts of things.
     */
    'Can instantiate with and without new keyword': function()
    {
        // with 'new' keyword
        this.assertOk(
            ( new this.Sut() ) instanceof this.Sut,
            "Should be able to instantiate MethodWrapperFactory with " +
                "'new' keyword"
        );

        // without 'new' keyword
        this.assertOk( ( this.Sut() instanceof this.Sut ),
            "Should be able to instantiate MethodWrapperFactory " +
                "without 'new' keyword"
        );
    },


    /**
     * The factory itself is rather simple. The class should accept a factory
     * function which should return the wrapped method.
     */
    'Provided factory function is properly called': function()
    {
        var _self        = this,
            called       = false,
            method       = function() {},
            super_method = function() {},
            cid          = 55,
            getInst      = function() {},
            name         = 'someMethod',
            keywords     = { 'static': true, 'public': true },
            retval       = 'foobar';

        var result = this.Sut(
            function(
                given_method, given_super, given_cid, givenGetInst, given_name,
                given_keywords
            )
            {
                called = true;

                _self.assertEqual( given_method, method,
                    "Factory method should be provided with method to wrap"
                );

                _self.assertEqual( given_super, super_method,
                    "Factory method should be provided with super method"
                );

                _self.assertEqual( given_cid, cid,
                    "Factory method should be provided with cid"
                );

                _self.assertEqual( givenGetInst, getInst,
                    "Factory method should be provided with proper inst function"
                );

                _self.assertEqual( given_name, name,
                    "Factory method should be provided with proper method name"
                );

                _self.assertEqual( given_keywords, keywords,
                    "Factory method should be provided with proper keywords"
                );

                return retval;
            }
        ).wrapMethod( method, super_method, cid, getInst, name, keywords );

        // we'll include this in addition to the following assertion (which is
        // redundant) to make debugging more clear
        this.assertEqual( called, true,
            "Given factory method should be called"
        );

        this.assertEqual( result, retval,
            "Should return value from factory function"
        );
    },
} );

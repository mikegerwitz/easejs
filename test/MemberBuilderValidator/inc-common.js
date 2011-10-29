/**
 * Shared functions for MemberBuilderValidator tests
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


/**
 * Quickly tests for validation failures
 *
 * The following will be ensured by this assertion:
 *  - An exception must be thrown
 *  - The exception message must contain the name of the member
 *  - The exception message must contain the identifier string
 *
 * @param {string} name       name expected in error string
 * @param {string} identifier string to match in error message
 *
 * @param {function()} action function to invoke for test
 *
 * @return {undefined}
 */
exports.quickFailureTest = function( name, identifier, action )
{
    var _self = this;

    _self.incAssertCount();

    try
    {
        action();
    }
    catch ( e )
    {
        // using the identifier, ensure the error string makes sense
        _self.assertOk( ( e.message.search( identifier ) !== -1 ),
            "Incorrect error; expected identifier '" + identifier +
            "', but received: " + e.message
        );

        // to aid in debugging, the error message should contain the
        // name of the method
        _self.assertOk( ( e.message.search( name ) !== -1 ),
            'Error message should contain method name'
        );

        return;
    }

    _self.fail( "Expected failure" );
};


/**
 * Tests to ensure that a member with the given keywords fails validation with
 * an error message partially matching the provided identifier
 *
 * To test overrides, specify keywords for 'prev'. To test for success instead
 * of failure, set identifier to null.
 */
exports.quickKeywordTest = function( type, keywords, identifier, prev )
{
    var keyword_obj = {},
        prev_obj    = {},
        prev_data   = {},
        name        = 'fooBar',
        _self       = this;

    // convert our convenient array into a keyword obj
    for ( var i = 0, len = keywords.length; i < len; i++ )
    {
        keyword_obj[ keywords[ i ] ] = true;
    }

    // if prev keywords were given, do the same thing with those to
    // generate our keyword obj
    if ( prev !== undefined )
    {
        for ( var i = 0, len = prev.length; i < len; i++ )
        {
            prev_obj[ prev[ i ] ] = true;
        }

        // define a dummy previous method value
        prev_data = { member: function() {} };
    }

    var testfunc = function()
    {
        _self.sut[ type ](
            name, function() {}, keyword_obj, prev_data, prev_obj
        );
    };

    if ( identifier )
    {
        _self.quickFailureTest( name, identifier, testfunc );
    }
    else
    {
        _self.assertDoesNotThrow( testfunc, Error );
    }
};


/**
 * Passes test visibility levels [ x1, x2 ] to test method T to ensure that test
 * T will pass when x2 is used to override a member declared using x1
 *
 * @param {function(function())} test test function
 *
 * @return {undefined}
 */
exports.visEscalationTest = function( test )
{
    var tests = [
        [ 'private',   'protected' ],
        [ 'protected', 'public' ],

        [ 'public',    'public' ],
        [ 'protected', 'protected' ],
        [ 'private',   'private' ]
    ];

    for ( var i = 0, len = tests.length; i < len; i++ )
    {
        var cur = tests[ i ];
        test( cur );
    }
};


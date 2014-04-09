/**
 * Shared functions for MemberBuilderValidator tests
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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

/**
 * Member name to be used in tests
 * @type {string}
 */
exports.testName = 'fooBar';


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
            'Error message should contain member name'
        );

        return;
    }

    _self.fail( false, true, "Expected failure" );
};


/**
 * Tests to ensure that a member with the given keywords fails validation with
 * an error message partially matching the provided identifier
 *
 * To test overrides, specify keywords for 'prev'. To test for success instead
 * of failure, set identifier to null.
 */
exports.quickKeywordTest = function(
    type, keywords, identifier, prev, prev_data
)
{
    var keyword_obj = {},
        prev_obj    = {},
        prev_data   = prev_data || {},
        name        = exports.testName,
        state       = {},
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
        prev_data.member = function() {};
    }

    var testfunc = function()
    {
        // proxies use strings, while all others use functions
        var val = ( keyword_obj[ 'proxy' ] ) ? 'proxyDest': function() {};

        _self.sut[ type ](
            name, val, keyword_obj, prev_data, prev_obj, state
        );
    };

    if ( identifier )
    {
        this.quickFailureTest.call( this, name, identifier, testfunc );
    }
    else
    {
        this.assertDoesNotThrow( testfunc );
    }

    this.sut.end( state );
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
    // note: private/private is intentionally omitted; see private naming
    // conflict test
    var tests = [
        [ 'protected', 'public'    ],
        [ 'public',    'public'    ],
        [ 'protected', 'protected' ],
    ];

    for ( var i = 0, len = tests.length; i < len; i++ )
    {
        var cur = tests[ i ];
        test( cur );
    }
};


exports.privateNamingConflictTest = function( test )
{
    var tests = [
        [ 'private', 'private'   ],
        [ 'private', 'protected' ],
        [ 'private',' public'    ],
    ];

    var i = tests.length;
    while ( i-- )
    {
        test( tests[ i ] );
    }
};


/**
 * Performs a simple visibility change test using access modifiers
 *
 * Important: invoke within the context of the test case.
 *
 * @param  {string}  start     start keyword
 * @param  {string}  override  overriding keyword
 * @param  {bool}    failtest  whether the assertion should test for failure
 *
 * @param  {function()}  func  test function
 *
 * @param  {string}  failstr  string to check for in failure string
 *
 * @return  {undefined}
 */
exports.quickVisChangeTest = function(
    start, override, failtest, func, failstr
)
{
    var _self = this,
        name  = 'foo',

        startobj    = {},
        overrideobj = {}
    ;

    startobj[ start ]       = true;
    overrideobj[ override ] = true;

    var testfun = function()
    {
        func( name, startobj, overrideobj );
    };

    if ( failtest )
    {
        this.quickFailureTest.call( this,
            name, ( failstr || 'de-escalate' ), testfun
        );
    }
    else
    {
        this.assertDoesNotThrow( testfun, Error );
    }
};


/**
 * Simple X-Unit-style test cases
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

var assert         = require( 'assert' ),
    assert_wrapped = {},
    acount         = 0,
    icount         = 0,
    scount         = 0,
    skpcount       = 0,
    tcount         = 0,

    // when set to true, final statistics will be buffered until suite ends
    suite    = false,
    failures = [],

    // dummy object to be thrown for test skipping
    SkipTest = { skip: true },

    common_require = require( __dirname + '/common' ).require
;


// wrap each of the assertions so that we can keep track of the number of times
// that they were invoked
for ( var f in assert )
{
    var _assert_cur = assert[ f ];

    if ( typeof _assert_cur !== 'function' )
    {
        continue;
    }

    // wrap the assertion to keep count
    assert_wrapped[ f ] = ( function( a )
    {
        return function()
        {
            incAssertCount();
            a.apply( this, arguments );
        };
    } )( _assert_cur );
}


function incAssertCount()
{
    acount++;
};


/**
 * Defines and runs a test case
 *
 * This is a very basic system that provides a more familiar jUnit/phpUnit-style
 * output for xUnit tests and allows all tests in the case to be run in the
 * event of a test failure.
 *
 * The test name should be given as the key and the test itself as a function as
 * the value. The test will be invoked within the context of the assertion
 * module.
 *
 * This will be evolving throughout the life of the project. Mainly, it cannot
 * be run as part of a suite without multiple summary outputs.
 *
 * @param  {string|Object.<string,function()>}  SUT module path; or object
 *                                              containing tests
 *
 * @param  {Object.<string,function()>=}  object containing tests, if first
 *                                        argument is provided
 *
 * @return  {undefined}
 */
module.exports = function( _, __ )
{
    var args      = Array.prototype.slice.call( arguments ),
        test_case = args.pop(),
        sutpath   = args.pop();

    var context  = prepareCaseContext(),
        setUp    = test_case.setUp;

    // automatically include SUT if its module path was provided
    if ( sutpath )
    {
        context.Sut = common_require( sutpath );
    }

    // if we're not running a suite, clear out the failures
    if ( !( suite ) )
    {
        init();
    }

    // perform case-wide setup
    test_case.caseSetUp && test_case.caseSetUp.call( context );

    // remove unneeded methods so we don't invoke them as tests below
    delete test_case.caseSetUp;
    delete test_case.setUp;

    // run each test in the case
    for ( var test in test_case )
    {
        var data   = test.match( /^(?:@(.*?)\((.*?)\))?(.*)$/ ),
            method = data[ 1 ],
            prop   = data[ 2 ],
            name   = data[ 3 ],
            count  = 1,
            args   = [ [] ]
        ;

        if ( method === 'each' )
        {
            if ( !( context[ prop ] ) )
            {
                throw Error( "Unknown @each context: " + prop );
            }

            count = context[ prop ].length;
            args  = [];

            for ( var i = 0; i < count; i++ )
            {
                args.push( [ context[ prop ][ i ] ] );
            }
        }
        else if ( method )
        {
            throw Error( "Unknown test method: " + method );
        }


        // perform the appropriate number of tests
        for ( var i = 0; i < count; i++ )
        {
            tryTest(
                test_case,
                test,
                ( setUp || null ),
                name + ( ( count > 1 )
                    ? ( ' (' + i + ')' )
                    : ''
                ),
                context,
                args[ i ]
            );

            // output a newline and the count every 60 tests
            ( tcount % 60 ) || testPrint( " " + tcount + "\n" );
        }
    }

    // only output statistics if we're not running a suite (otherwise they'll be
    // output at the end of the suite)
    if ( !( suite ) )
    {
        endStats();
    }
};


/**
 * Attempt a test
 *
 * @param  {Object}    test_case  object containing all test cases
 * @param  {string}    test       complete key of test to run
 * @param  {Function}  setUp      test setup method, or null
 * @param  {string}    test_str   text to use on failure
 * @param  {Object}    context    context to bind to test function
 * @param  {Array}     args       arguments to pass to test function
 *
 * @return {undefined}
 */
function tryTest( test_case, test, setUp, test_str, context, args )
{
    var acount_last = acount;

    try
    {
        // xUnit-style setup
        if ( setUp )
        {
            setUp.call( context );
        }

        test_case[ test ].apply( context, args );

        // if there were no assertions, then the test should be marked as
        // incomplete
        if ( acount_last === acount )
        {
            testPrint( 'I' );
            icount++;
        }
        else
        {
            scount++;
            testPrint( '.' );
        }
    }
    catch ( e )
    {
        if ( e === SkipTest )
        {
            testPrint( 'S' );
            skpcount++;
        }
        else
        {
            testPrint( 'F' );
            failures.push( [ test_str, e ] );
        }
    }

    tcount++;
}


/**
 * Reset counters
 */
function init()
{
    failures = [];
    scount   = acount = icount = skpcount = 0;
}


/**
 * Display end stats (failures, counts)
 */
function endStats()
{
    testPrint( "\n" );
    if ( tcount % 60 !== 0 )
    {
        testPrint( "\n" );
    }

    if ( failures.length )
    {
        outputTestFailures( failures );
    }

    // print test case summary
    testPrint(
        ( ( failures.length ) ? "FAILED" : "OK" ) + " - " +
        scount + " successful, " + failures.length + " failure(s), " +
        ( ( icount > 0 ) ? icount + ' incomplete, ' : '' ) +
        ( ( skpcount > 0 ) ? skpcount + ' skipped, ' : '' ) +
        ( scount + icount + skpcount + failures.length ) + " total " +
        '(' + acount + " assertion" + ( ( acount !== 1 ) ? 's' : '' ) + ")\n"
    );

    // exit with non-zero status to indicate failure
    failures.length
        && typeof process !== 'undefined'
        && process.exit( 1 );
}


/**
 * Start test suite, deferring summary stats until call to endSuite()
 */
module.exports.startSuite = function()
{
    init();
    suite = true;
};


/**
 * Ens test suite, display stats buffered since startSuite()
 */
module.exports.endSuite = function()
{
    suite = false;
    endStats();
};


function getMock( proto )
{
    var P    = common_require( proto ),
        Mock = function() {},

        proto = Mock.prototype = new P()
    ;

    for ( var i in proto )
    {
        // only mock out methods
        if ( typeof proto[ i ] !== 'function' )
        {
            continue;
        }

        // clear the method
        proto[ i ] = function() {};
    }

    return new Mock();
}


function skipTest()
{
    throw SkipTest;
}


/**
 * Prepare assertion methods on context
 *
 * @return  {Object}  context
 */
function prepareCaseContext()
{
    return {
        require: common_require,

        fail:                 assert_wrapped.fail,
        assertOk:             assert_wrapped.ok,
        assertEqual:          assert_wrapped.equal,
        assertNotEqual:       assert_wrapped.notEqual,
        assertDeepEqual:      assert_wrapped.deepEqual,
        assertStrictEqual:    assert_wrapped.strictEqual,
        assertNotStrictEqual: assert_wrapped.notStrictEqual,
        assertThrows:         assert_wrapped['throws'],
        assertDoesNotThrow:   assert_wrapped.doesNotThrow,
        assertIfError:        assert_wrapped.ifError,
        incAssertCount:       incAssertCount,

        getMock: getMock,
        skip:    skipTest,
    };
}


/**
 * Outputs test failures and their stack traces
 *
 * @param  {Array}  failures
 *
 * @return  {undefined}
 */
function outputTestFailures( failures )
{
    var i, cur, name, e;

    // if we don't have stdout access, throw an error containing each of the
    // error strings
    if ( typeof process === 'undefined' )
    {
        var err = '',
            i   = failures.length;

        for ( var i in failures )
        {
            var failure = failures[ i ];

            err += failure[ 0 ] +
                ' (' + ( failure[ 1 ].message || 'no message' ) + ')' +
                ( ( failure[ 1 ].stack )
                    ? ( '<br />' +
                        failure[ 1 ].stack.replace( /\n/g, '<br />' ) +
                        '<br />'
                    )
                    : '; '
                )
        }

        throw Error( err );
    }

    for ( var i = 0; i < failures.length; i++ )
    {
        cur = failures[ i ];

        name = cur[ 0 ];
        e    = cur[ 1 ];  // ideally Error, but may not be

        // output the name followed by the stack trace
        testPrint(
            '#' + i + ' ' + name + '\n'
            + ( e.stack || e ) + "\n\n"
        );
    }
}


/**
 * Outputs a string if stdout is available (node.js)
 *
 * @param  {string}  str  string to output
 *
 * @return  {undefined}
 */
var testPrint = ( ( typeof process === 'undefined' )
    || ( typeof process.stdout === 'undefined' ) )
        ? function() {}
        : function( str )
        {
            process.stdout.write( str );
        };


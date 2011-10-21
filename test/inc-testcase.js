

var assert         = require( 'assert' ),
    assert_wrapped = {},
    acount         = 0;


// wrap each of the assertions so that we can keep track of the number of times
// that they were invoked
for ( f in assert )
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
 * @param  {Object.<string,function()>}  object containing tests
 *
 * @return  {undefined}
 */
module.exports = function( test_case )
{
    var failures = [],
        scount   = 0,
        context  = prepareCaseContext(),
        setUp    = test_case.setUp;

    // reset assertion count for this case
    acount = 0;

    // perform case-wide setup
    test_case.caseSetUp && test_case.caseSetUp.call( context );

    // remove unneeded methods so we don't invoke them as tests below
    delete test_case.caseSetUp;
    delete test_case.setUp;

    // run each test in the case
    for ( test in test_case )
    {
        // xUnit-style setup
        if ( setUp )
        {
            setUp.call( context );
        }

        try
        {
            test_case[ test ].call( context );

            scount++;
            testPrint( '.' );
        }
        catch ( e )
        {
            testPrint( 'F' );
            failures.push( [ test, e ] );
        }
    }

    testPrint( "\n\n" );

    if ( failures.length )
    {
        outputTestFailures( failures );
    }

    // print test case summary
    testPrint(
        ( ( failures.length ) ? "FAILED" : "OK" ) + " - " +
        scount + " successful, " + failures.length + " failure(s), " +
        ( scount + failures.length ) + " total " +
        '(' + acount + " assertion" + ( ( acount !== 1 ) ? 's' : '' ) + ")\n"
    );

    // exit with non-zero status to indicate failure
    failures.length
        && typeof process !== 'undefined'
        && process.exit( 1 );
};


/**
 * Prepare assertion methods on context
 *
 * @return  {Object}  context
 */
function prepareCaseContext()
{
    return {
        require: require( __dirname + '/common' ).require,

        fail:                 assert_wrapped.fail,
        assertOk:             assert_wrapped.ok,
        assertEqual:          assert_wrapped.equal,
        assertNotEqual:       assert_wrapped.notEqual,
        assertDeepEqual:      assert_wrapped.deepEqual,
        assertStrictEqual:    assert_wrapped.strictEqual,
        assertNotStrictEqual: assert_wrapped.notStrictEqual,
        assertThrows:         assert_wrapped.throws,
        assertDoesNotThrow:   assert_wrapped.doesNotThrow,
        assertIfError:        assert_wrapped.ifError,
        incAssertCount:       incAssertCount,
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

        for ( i in failures )
        {
            err += failures[ i ][ 0 ] + '; ';
        }

        throw Error( err );
    }

    for ( i = 0; i < failures.length; i++ )
    {
        cur = failures[ i ];

        name = cur[ 0 ];
        e    = cur[ 1 ];

        // output the name followed by the stack trace
        testPrint(
            '#' + i + ' ' + name + '\n'
            + e.stack + "\n\n"
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


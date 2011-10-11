

var assert = require( 'assert' );


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
        ( scount + failures.length ) + " total\n"
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

        fail:                 assert.fail,
        assertOk:             assert.ok,
        assertEqual:          assert.equal,
        assertNotEqual:       assert.notEqual,
        assertDeepEqual:      assert.deepEqual,
        assertStrictEqual:    assert.strictEqual,
        assertNotStrictEqual: assert.notStrictEqual,
        assertThrows:         assert.throws,
        assertDoesNotThrow:   assert.doesNotThrow,
        assertIfError:        assert.ifError,
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


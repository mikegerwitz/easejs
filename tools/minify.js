/**
 * Minification script
 *
 * Takes input from stdin, mangles and minifies it, then outputs to stdout.
 *   ex: $ node minify.js < source.js > source.min.js
 */

// uses UglifyJS
var uglify,
    FILE_ROOT = '../build/';

try
{
    // attempt to load UglifyJS
    var uglify = require( 'uglify-js' );
}
catch ( e )
{
    // if there's a problem loading it, let the user know what they probably
    // need to do
    process.stderr.write(
        "Unable to located UglifyJS. Please run:\n\n" +
        "  $ npm install uglify-js\n\n" +
        "and then try again.\n"
    );

    process.exit( 1 );
}

var parser = uglify.parser,
    uglify = uglify.uglify;

// we should receive the file via stdin
var data = '';
process.stdin
    .on( 'data', function( chunk )
    {
        data += chunk;
    } )
    .on( 'end', function()
    {
        minify();
    } )
;

// stdin is paused by default, so we have to unpause it to read
process.stdin.setEncoding( 'utf8' )
process.stdin.resume()


/**
 * Minifies and outputs the code
 *
 * The process involves mangling the code and minifying it.
 */
function minify()
{
    var ast  = parser.parse( data );

    // mange and minify
    ast = uglify.ast_squeeze( ast );

    // output final, compressed code
    process.stdout.write( uglify.gen_code( ast ) );
}


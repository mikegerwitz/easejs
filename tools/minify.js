/**
 * Minification script
 *
 * Takes input from stdin, mangles and minifies it, then outputs to stdout.
 *   ex: $ node minify.js < source.js > source.min.js
 */

// uses UglifyJS
var parser = require( 'uglify-js' ).parser,
    uglify = require( 'uglify-js' ).uglify,

    FILE_ROOT = '../build/'
;

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
    ast = uglify.ast_mangle( ast );
    ast = uglify.ast_squeeze( ast );

    // output final, compressed code
    process.stdout.write( uglify.gen_code( ast ) );
}


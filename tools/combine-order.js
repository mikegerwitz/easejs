/**
 * Determines dependency order
 *
 * This script will determine the order in which files must be concatenated
 * in order to run properly. Dependencies must be added before the file that
 * depends on them.
 *
 * Circular dependencies are not supported, nor should they be.
 *
 *  Copyright (C) 2011, 2013 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under
 *  the terms of the GNU General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your
 *  option) any later version.
 *
 *  This program is distributed in the hope that it will be useful, but
 *  WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *  General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License along
 *  with this program.  If not, see <http://www.gnu.org/licenses/>.
 */


// files and their dependencies are expected from stdin in the following format,
// one relationship per line:
//   file dep
getStdinData( function( data )
{
    var ordered = [],
        deps    = parseLines( data ),
        current = ''
    ;

    // Continue the ordering process until there are no more files remaining.
    // This is necessary because not all files may be a dependency of another.
    // There may be groups of completely unrelated files.
    while ( current = Object.keys( deps )[0] )
    {
        orderDeps( deps, current, ordered );
    }

    outputFiles( ordered );
} );


/**
 * Output each file, one per line
 *
 * @param  {Array.<string>} files  files to output
 *
 * @return  {undefined}
 */
function outputFiles( files )
{
    files.forEach( function( file )
    {
        console.log( file );
    } );
}


/**
 * Recursively order dependencies for each file
 *
 * For each file (current var), loop through each of its dependencies. Before
 * adding itself to the list, it will recurse and loop through the dependency's
 * dependencies. This process will continue until no more dependencies are
 * found or found dependencies have already been parsed. This will result in the
 * file being added to the list after each of its dependencies, recursively. It
 * may be easier just to read the actual code.
 *
 * Circular dependencies are not supported, but they are detected and will
 * cause termination of the script with a non-zero exit code.
 *
 * @param  {Object}  deps     dependency list
 * @param  {string}  current  file to parse
 * @param  {Array}   ordered  destination array
 *
 * @return  {Array}  ordered array
 */
var orderDeps = ( function()
{
    var processed = {},
        processing = {};

    return function orderDeps( deps, current, ordered )
    {
        // if we've already processed this dependency, don't do it again
        if ( processed[ current ] )
        {
            return;
        }

        // prevent infinite recursion that would be caused by circular
        // dependencies
        if ( processing[ current ] )
        {
            console.error( "Circular dependency detected: %s", current );
            process.exit( 1 );
        }

        processing[ current ] = true;

        // process each dependency for this file
        ( deps[ current ] || [] ).forEach( function( dep )
        {
            // first, insert dependencies of our dependency
            orderDeps( deps, dep, ordered );
        } );

        // add self /after/ dependencies have been added
        ordered.push( current );
        processed[ current ] = true;

        // ensure we don't parse it again
        delete deps[ current ];
        delete processing[ current ];

        return ordered;
    };
} )();


/**
 * Parse each line into a dependency list for each file
 *
 * @param  {string}  data  string data to parse
 *
 * @return  {Object.<Array.<string>>}  dependency list for each file
 */
function parseLines( data )
{
    var lines = data.split( '\n' ),
        deps  = {};

    lines.forEach( function( line )
    {
        // skip blank lines
        if ( !line )
        {
            return;
        }

        var dep_info = line.split( ' ' ),
            file     = dep_info[ 0 ],
            dep      = dep_info[ 1 ]
        ;

        deps[ file ] = deps[ file ] || [];
        deps[ file ].push( dep );
    } );

    return deps;
}


/**
 * Asynchronously retrieve data from stdin
 *
 * @param  {function(Object)}  callback to call with data
 *
 * @return  {string}  data from stdin
 */
function getStdinData( callback )
{
    var data = '';

    process.stdin.resume();
    process.stdin.setEncoding( 'ascii' );

    process.stdin
        .on( 'data', function( chunk )
        {
            data += chunk;
        } )
        .on( 'end', function()
        {
            callback( data );
        } )
    ;
}


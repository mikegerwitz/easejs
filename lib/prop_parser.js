/**
 * Property keyword parser module
 *
 *  Copyright (C) 2010,2011 Mike Gerwitz
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
 */

/**
 * Known (permitted) keywords
 * @type {Object.<string,boolean>}
 */
var _keywords = {
    'public':    true,
    'protected': true,
    'private':   true,
    'static':    true,
    'abstract':  true,
    'const':     true,
    'virtual':   true,
    'override':  true,
};


/**
 * Parses property keywords
 *
 * @param  {string}  prop  property string, which may contain keywords
 *
 * @return  {{name: string, keywords: Object.<string, boolean>}}
 */
exports.parseKeywords = function ( prop )
{
    var name        = prop,
        keywords    = [],
        keyword_obj = {};

    prop = ''+( prop );

    // only perform parsing if the string contains a space
    if ( / /.test( prop ) )
    {
        // the keywords are all words, except for the last, which is the
        // property name
        keywords = prop.split( /\s+/ );
        name     = keywords.pop();

        var i       = keywords.length,
            keyword = '';

        while ( i-- )
        {
            keyword = keywords[ i ];

            // ensure the keyword is recognized
            if ( !_keywords[ keyword ] )
            {
                throw Error(
                    "Unexpected keyword for '" + name + "': " + keyword
                );
            }

            keyword_obj[ keyword ] = true;
        }
    }

    return {
        name:     name,
        keywords: keyword_obj,
    };
}

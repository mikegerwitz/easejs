/**
 * Property keyword parser module
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
 * @package core
 */


/**
 * Parses property keywords
 *
 * @param  {string}  prop  property string, which may contain keywords
 *
 * @return  {{name: string, keywords: Object.<string, boolean>}}
 */
exports.parse = function ( prop )
{
    var name        = prop,
        keywords    = [],
        keyword_obj = {};

    prop = ''+( prop );

    if ( prop.length > 8 )
    {
        if ( prop[ 8 ] === ' ' )
        {
            // the keywords are all words, except for the last, which is the
            // property name
            keywords = prop.split( ' ' );
            name     = keywords.pop();

            var i = keywords.length;
            while ( i-- )
            {
                keyword_obj[ keywords[ i ] ] = true;
            }
        }
    }

    return {
        name:     name,
        keywords: keyword_obj,
    };
}

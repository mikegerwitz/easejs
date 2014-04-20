/**
 * Property keyword parser module
 *
 *  Copyright (C) 2010, 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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
 * Known (permitted) keywords
 * @type {Object.<string,boolean>}
 */
var _keywords = {
    'public':    1,
    'protected': 1<<1,
    'private':   1<<2,
    'static':    1<<3,
    'abstract':  1<<4,
    'const':     1<<5,
    'virtual':   1<<6,
    'override':  1<<7,
    'proxy':     1<<8,
    'weak':      1<<9,
};

/**
 * Keyword masks for conveniently checking the keyword bitfield
 * @type {Object.<string,integer>}
 */
var _kmasks = {
    amods: _keywords[ 'public' ]
        | _keywords[ 'protected' ]
        | _keywords[ 'private' ],

    'virtual': _keywords[ 'abstract' ]
        | _keywords[ 'virtual' ],
};


// expose magic values
exports.kvals  = _keywords;
exports.kmasks = _kmasks;


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
        bitwords    = 0x00,
        keyword_obj = {};

    prop = ''+( prop );

    // the keywords are all words, except for the last, which is the
    // property name
    if ( ( keywords = prop.split( /\s+/ ) ).length !== 1 )
    {
        name = keywords.pop();

        var i = keywords.length;
        while ( i-- )
        {
            var keyword = keywords[ i ],
                kval    = _keywords[ keyword ];

            // ensure the keyword is recognized
            if ( !kval )
            {
                throw Error(
                    "Unexpected keyword for '" + name + "': " + keyword
                );
            }

            // ease-of-access
            keyword_obj[ keyword ] = true;

            // permits quick and concise checks
            bitwords |= kval;
        }
    }

    // members with an underscore prefix are implicitly private, unless an
    // access modifier is explicitly provided; double-underscore is ingored,
    // as they denote special members that do not become part of the
    // prototype and are reserved by ease.js
    if ( ( name.match( /^_[^_]/ ) && !( bitwords & _kmasks.amods ) ) )
    {
        keyword_obj[ 'private' ] = true;
        bitwords |= _keywords[ 'private' ];
    }

    return {
        name:     name,
        keywords: keyword_obj,
        bitwords: bitwords,
    };
}

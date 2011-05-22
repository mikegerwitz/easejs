/**
 * Wrapper permitting the definition of final classes
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

var Class = require( __dirname + '/class' );

module.exports = function()
{
    // the last argument _should_ be the definition
    var dfn = arguments[ arguments.length - 1 ];

    if ( typeof dfn === 'object' )
    {
        // mark it as final
        dfn.___$$final$$ = true;
    }

    // forward everything to Class
    return Class.apply( this, arguments );
};


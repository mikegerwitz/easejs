/**
 * Wrapper permitting the definition of abstract classes
 *
 * This doesn't actually introduce any new functionality. Rather, it sets a flag
 * to allow abstract methods within a class, forcing users to clearly state
 * that a class is abstract.
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


module.exports = exports = function()
{
    markAbstract( arguments );

    // forward everything to Class
    return Class.apply( this, arguments );
};


exports.extend = function()
{
    markAbstract( arguments );

    return Class.extend.apply( this, arguments );
};


exports.implement = function()
{
    var impl   = Class.implement.apply( this, arguments ),
        extend = impl.extend;

    impl.extend = function()
    {
        markAbstract( arguments );
        return extend.apply( this, arguments );
    };

    return impl;
};


function markAbstract( args )
{
    // the last argument _should_ be the definition
    var dfn = args[ args.length - 1 ];

    if ( typeof dfn === 'object' )
    {
        // mark as abstract
        dfn.___$$abstract$$ = true;
    }
}


/**
 * Wrapper permitting the definition of final classes
 *
 *  Copyright (C) 2010, 2011, 2013 Free Software Foundation, Inc.
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

var Class = require( './class' );


/**
 * Creates a final class
 *
 * @return  {Function}  final class
 */
exports = module.exports = function()
{
    markFinal( arguments[ arguments.length - 1 ] );

    // forward everything to Class
    var result = Class.apply( this, arguments );

    if ( !Class.isClass( result ) )
    {
        finalOverride( result );
    }

    return result;
};


/**
 * Creates a final class from a class extend operation
 *
 * @return  {Function}  final class
 */
exports.extend = function()
{
    markFinal( arguments[ arguments.length - 1 ] );
    return Class.extend.apply( this, arguments );
};


/**
 * Causes a definition to be flagged as final
 *
 * @param  {!Arguments}  dfn  suspected definition object
 *
 * @return  {undefined}
 */
function markFinal( dfn )
{
    if ( typeof dfn === 'object' )
    {
        // mark as abstract
        dfn.___$$final$$ = true;
    }
}


/**
 * Overrides object members to permit final classes
 *
 * @param  {Object}  obj  object to override
 *
 * @return  {undefined}
 */
function finalOverride( obj )
{
    var extend = obj.extend;

    // wrap extend, applying the abstract flag
    obj.extend = function()
    {
        markFinal( arguments[ arguments.length - 1 ] );
        return extend.apply( this, arguments );
    };
}


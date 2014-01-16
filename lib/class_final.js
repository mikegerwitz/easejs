/**
 * Wrapper permitting the definition of final classes
 *
 *  Copyright (C) 2010, 2011, 2013 Mike Gerwitz
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

var Class = require( __dirname + '/class' );


/**
 * Creates a final class
 *
 * @return  {Function}  final class
 */
exports = module.exports = function()
{
    markFinal( arguments );

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
    markFinal( arguments );
    return Class.extend.apply( this, arguments );
};


/**
 * Causes a definition to be flagged as final
 *
 * This function assumes the last argument to be the definition, which is the
 * common case, and modifies the object referenced by that argument.
 *
 * @param  {!Arguments}  args  arguments to parse
 *
 * @return  {undefined}
 */
function markFinal( args )
{
    // the last argument _should_ be the definition
    var dfn = args[ args.length - 1 ];

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
        markFinal( arguments );
        return extend.apply( this, arguments );
    };
}


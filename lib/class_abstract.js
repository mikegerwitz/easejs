/**
 * Wrapper permitting the definition of abstract classes
 *
 * This doesn't actually introduce any new functionality. Rather, it sets a flag
 * to allow abstract methods within a class, forcing users to clearly state
 * that a class is abstract.
 *
 *  Copyright (C) 2011 Mike Gerwitz
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

var Class = require( __dirname + '/class' );


/**
 * Creates an abstract class
 *
 * @return  {Function}  abstract class
 */
module.exports = exports = function()
{
    markAbstract( arguments );

    // forward everything to Class
    var result = Class.apply( this, arguments );

    // if we're using the temporary object, then override its methods to permit
    // abstract classes
    if ( !Class.isClass( result ) )
    {
        abstractOverride( result );
    }

    return result;
};


/**
 * Creates an abstract class from a class extend operation
 *
 * @return  {Function}  abstract class
 */
exports.extend = function()
{
    markAbstract( arguments );
    return Class.extend.apply( this, arguments );
};


/**
 * Creates an abstract class implementing the given members
 *
 * Simply wraps the class module's implement() method.
 *
 * @return  {Object}  abstract class
 */
exports.implement = function()
{
   var impl = Class.implement.apply( this, arguments );

    abstractOverride( impl );
    return impl;
};


/**
 * Causes a definition to be flagged as abstract
 *
 * This function assumes the last argument to be the definition, which is the
 * common case, and modifies the object referenced by that argument.
 *
 * @param  {Arguments}  args  arguments to parse
 *
 * @return  {undefined}
 */
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


/**
 * Overrides object members to permit abstract classes
 *
 * @param  {Object}  obj  object to override
 *
 * @return  {Object}  obj
 */
function abstractOverride( obj )
{
    var extend = obj.extend,
        impl   = obj.implement;

    // wrap and apply the abstract flag, only if the method is defined (it may
    // not be under all circumstances, e.g. after an implement())
    impl && ( obj.implement = function()
    {
        return abstractOverride( impl.apply( this, arguments ) );
    } );

    // wrap extend, applying the abstract flag
    obj.extend = function()
    {
        markAbstract( arguments );
        return extend.apply( this, arguments );
    };

    return obj;
}


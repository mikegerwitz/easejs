/**
 * Wrapper permitting the definition of abstract classes
 *
 * This doesn't actually introduce any new functionality. Rather, it sets a
 * flag to allow abstract methods within a class, forcing users to clearly
 * state that a class is abstract.
 *
 *  Copyright (C) 2010, 2011, 2013, 2014 Free Software Foundation, Inc.
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
 * Creates an abstract class
 *
 * @return  {Function}  abstract class
 */
module.exports = exports = function()
{
    markAbstract( arguments[ arguments.length - 1 ] );

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
    markAbstract( arguments[ arguments.length - 1 ] );
    return Class.extend.apply( this, arguments );
};


/**
 * Mixes in a trait
 *
 * @return  {Object}  staged abstract class
 */
exports.use = function()
{
    return abstractOverride(
        Class.use.apply( this, arguments )
    );
};


/**
 * Creates an abstract class implementing the given members
 *
 * Simply wraps the class module's implement() method.
 *
 * @return  {Object}  staged abstract class
 */
exports.implement = function()
{
    return abstractOverride(
        Class.implement.apply( this, arguments )
    );
};


/**
 * Causes a definition to be flagged as abstract
 *
 * @param  {*}  dfn  suspected definition object
 *
 * @return  {undefined}
 */
function markAbstract( dfn )
{
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
        impl   = obj.implement,
        use    = obj.use;

    // wrap and apply the abstract flag, only if the method is defined (it
    // may not be under all circumstances, e.g. after an implement())
    impl && ( obj.implement = function()
    {
        return abstractOverride( impl.apply( this, arguments ) );
    } );

    var mixin = false;
    use && ( obj.use = function()
    {
        return abstractOverride( use.apply( this, arguments ) );
    } );

    // wrap extend, applying the abstract flag
    obj.extend = function()
    {
        markAbstract( arguments[ arguments.length - 1 ] );
        return extend.apply( this, arguments );
    };

    // used by mixins; we need to mark the intermediate subtype as abstract,
    // but ensure we don't throw any errors if no abstract members are mixed
    // in (since thay may be mixed in later on)
    obj.__createBase = function()
    {
        return extend( { ___$$auto$abstract$$: true } );
    };

    return obj;
}


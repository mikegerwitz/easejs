/**
 * Handles building members (properties, methods)
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

var visibility = [ 'public', 'protected', 'private' ];


/**
 * Initializes member object
 *
 * The member object contains members for each level of visibility (public,
 * protected and private).
 *
 * @param  {Object}  mpublic     default public members
 * @param  {Object}  mprotected  default protected members
 * @param  {Object}  mprivate    default private members
 *
 * @return  {{public: Object, protected: Object, private: Object}}
 */
exports.initMembers = function( mpublic, mprotected, mprivate )
{
    return {
        'public':    mpublic    || {},
        'protected': mprotected || {},
        'private':   mprivate   || {},
    };
};


/**
 * Copies a method to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   property name
 * @param  {*}       value  property value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @return  {undefined}
 */
exports.buildMethod = function( members, meta, name, value, keywords )
{
    var prev = scanMembers( members, name );

    // disallow overriding properties with methods
    if ( prev && !( prev instanceof Function ) )
    {
        throw new TypeError(
            "Cannot override property '" + name + "' with method"
        );
    }

    // ensure parameter list is at least the length of its supertype
    if ( prev && (value.length < prev.length ) )
    {
        throw new TypeError(
            "Declaration of method '" + name + "' must be compatiable " +
                "with that of its supertype"
        );
    }

    getMemberVisibility( members, keywords )[ name ] = value;
};


/**
 * Copies a property to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   property name
 * @param  {*}       value  property value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @return  {undefined}
 */
exports.buildProp = function( members, meta, name, value, keywords )
{
    // disallow overriding methods with properties
    if ( scanMembers( members, name ) instanceof Function )
    {
        throw new TypeError(
            "Cannot override method '" + name + "' with property"
        );
    }

    getMemberVisibility( members, keywords )[ name ] = value;
};


/**
 * Copies a getter to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   getter name
 * @param  {*}       value  getter value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @return  {undefined}
 */
exports.buildGetter = function( members, meta, name, value, keywords )
{
    getMemberVisibility( members, keywords ).__defineGetter__( name, value );
};


/**
 * Copies a setter to the appropriate member prototype, depending on
 * visibility, and assigns necessary metadata from keywords
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object}  meta   metadata container
 * @param  {string}  name   setter name
 * @param  {*}       value  setter value
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @return  {undefined}
 */
exports.buildSetter = function( members, meta, name, value, keywords )
{
    getMemberVisibility( members, keywords ).__defineSetter__( name, value );
};


/**
 * Returns member prototype to use for the requested visibility
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {Object.<string,boolean>}  keywords  parsed keywords
 *
 * @return  {Object}  reference to visibility of members argument to use
 */
function getMemberVisibility( members, keywords )
{
    var viserr = function()
    {
        throw TypeError(
            "Only one of public, protected or private may be used"
        );
    }

    // there's cleaner ways of doing this, but consider it loop unrolling for
    // performance
    if ( keywords[ 'private' ] )
    {
        ( keywords[ 'public' ] || keywords[ 'protected' ] ) && viserr();
        return members[ 'private' ];
    }
    else if ( keywords[ 'protected' ] )
    {
        ( keywords[ 'public' ] || keywords[ 'private' ] ) && viserr();
        return members[ 'protected' ];
    }
    else
    {
        // public keyword is the default, so explicitly specifying it is only
        // for clarity
        ( keywords[ 'private' ] || keywords[ 'protected' ] ) && viserr();
        return members[ 'public' ];
    }
}


/**
 * Scan each level of visibility for the requested member
 *
 * @param  {{public: Object, protected: Object, private: Object}} members
 *
 * @param  {string}  name  member to locate
 *
 * @return  {*}  member, if located, otherwise undefined
 */
function scanMembers( members, name )
{
    var i      = visibility.length,
        member = null;

    // locate requested member by scanning each level of visibility
    while ( i-- )
    {
        if ( member = members[ visibility[ i ] ][ name ] )
        {
            return member;
        }
    }

    return undefined;
}


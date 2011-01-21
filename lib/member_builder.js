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
    getMemberVisibility( members, keywords )[ name ] = value;
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


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
    if ( keywords[ 'public' ] )
    {
        members[ 'public' ][ name ] = value;
    }
    else if ( keywords[ 'protected' ] )
    {
        members[ 'protected' ][ name ] = value;
    }
    else if ( keywords[ 'private' ] )
    {
        members[ 'private' ][ name ] = value;
    }
};


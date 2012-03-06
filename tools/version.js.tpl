/**
 * Provides version information
 *
 *  Copyright (C) 2010,2011 Mike Gerwitz
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

/*** DO NOT MODIFY; generated by verset ***/

var major  = @MAJOR@,
    minor  = @MINOR@,
    rev    = @REV@,
    suffix = '@SUFFIX@',

    version = [ major, minor, rev, suffix ];

version.major  = major;
version.minor  = minor;
version.rev    = rev;
version.suffix = suffix;

version.toString = function()
{
    return this.join( '.' )
        .replace( /\.([^.]+)$/, '-$1' )
        .replace( /-$/, '' );
};

module.exports = version;

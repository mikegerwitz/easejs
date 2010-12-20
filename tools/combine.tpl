/**
 * Combined redistributable ease.js file
 *
 * This file contains all ease.js modules in a single file for easy distribution
 * in a browser environment.
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
 */

/**
 * ease.js namespace
 *
 * All modules will be available via this namespace. In CommonJS format, they
 * were accessed via the require() function. For example:
 *
 *   var util = require( 'easejs' ).Class;
 *
 * In this file, the above would be written as:
 *
 *   var util = easejs.Class;
 *
 * @type  {Object}
 */
var easejs = {};

( function( ns_exports )
{
    /**
     * CommonJS module exports
     *
     * Since this file contains all of the modules, this will be populated with
     * every module right off the bat.
     *
     * @type  {Object.<string,Object>}
     */
    var exports = {};

    /**
     * Returns the requested module
     *
     * The require() function is likely unavailable client-side (within a web
     * browser). Therefore, we mock one. If it is available, this overwrites it.
     * Our modules are all preloaded in the exports object.
     *
     * @param  {string}  module_id  id of the module to load
     *
     * @return  {Object}  exports of requested module
     */
    var require = function( module_id )
    {
        // remove the './' directory prefix (every module is currently included
        // via a relative path)
        var id_clean = module_id.substring( 2 );

        // attempt to retrieve the module
        var module = exports[ id_clean ];
        if ( module === undefined )
        {
            throw "[ease.js] Undefined module: " + module_id;
        }

        return module;
    };

/**{CONTENT}**/

    // the following should match the exports of /index.js
    ns_exports.Class = exports.class;
} )( easejs );


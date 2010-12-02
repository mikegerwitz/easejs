/**
 * Contains interface module
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

var can_freeze = require( './util' ).canFreeze();


/**
 * Creates an interface
 *
 * @return  {Interface}  extended interface
 */
exports.extend = function()
{
    return extend.apply( this, arguments );
}


/**
 * Default interface implementation
 *
 * @return  {undefined}
 */
function Interface() {}


function extend()
{
    var args      = Array.prototype.slice.call( arguments ),
        props     = prop_check( args.pop() ) || {},
        base      = args.pop() || Interface,
        prototype = new base();

    var new_interface = {};

    // freeze the interface (preventing additions) if supported
    if ( can_freeze )
    {
        Object.freeze( new_interface );
    }

    return new_interface;
}


/**
 * Checks to ensure that only methods are being declared
 *
 * @param  {Object}  props  interface definition
 *
 * @return  {Object}  the same properties that were passed to the function
 */
function prop_check( props )
{
    for ( prop in props )
    {
        if ( !( props[ prop ] instanceof Function ) )
        {
            throw new Error(
                "Only methods are permitted within Interface definitons"
            );
        }
    }

    return props;
}


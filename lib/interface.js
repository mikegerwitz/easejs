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

var util = require( './util' );


/**
 * Creates an interface
 *
 * @return  {Interface}  extended interface
 */
exports.extend = function()
{
    return extend.apply( this, arguments );
}


exports.abstractMethod = util.createAbstractMethod;


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

    var new_interface = function() {};

    util.propCopy( props, prototype );

    attach_extend( new_interface );
    new_interface.prototype   = prototype;
    new_interface.constructor = new_interface;

    // freeze the interface (preventing additions), if supported
    util.freeze( new_interface );

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
        if ( util.isAbstractMethod( props[ prop ] ) === false )
        {
            throw new Error(
                "Only abstract methods are permitted within Interface definitons"
            );
        }
    }

    return props;
}


/**
 * Attaches extend method to the given function (interface)
 *
 * @param  {Function}  func  function (interface) to attach method to
 *
 * @return  {undefined}
 */
function attach_extend( func )
{
    /**
     * Shorthand for extending interfaces
     *
     * This method can be invoked on the object, rather than having to call
     * Interface.extend( this ).
     *
     * @param  {Object}  props  properties to add to extended interface
     *
     * @return  {Object}  extended interface
     */
    util.defineSecureProp( func, 'extend', function( props )
    {
        return extend( this, props );
    });
}


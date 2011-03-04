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

var util           = require( './util' ),
    member_builder = require( './member_builder' ),
    Class          = require( './class' );


/**
 * This module may be invoked in order to provide a more natural looking
 * interface definition
 *
 * Only new interfaces may be created using this method. They cannot be
 * extended. To extend an existing interface, call its extend() method, or use
 * the extend() method of this module.
 *
 * @param  {Object}  def  interface definition
 *
 * @return  {Interface}  new interface
 */
module.exports = function( def )
{
    // if the first argument is an object, then we are declaring an interface
    if ( typeof def !== 'object' )
    {
        throw TypeError(
            "Must provide interface definition when declaring interface"
        );
    }

    // ensure we have the proper number of arguments (if they passed in too
    // many, it may signify that they don't know what they're doing, and likely
    // they're not getting the result they're looking for)
    if ( arguments.length > 1 )
    {
        throw Error(
            "Expecting one argument for Interface definition; " +
                arguments.length + " given."
        );
    }

    return extend( def );
};


/**
 * Creates an interface
 *
 * @return  {Interface}  extended interface
 */
module.exports.extend = function()
{
    return extend.apply( this, arguments );
};


/**
 * Determines whether the provided object is an interface created through
 * ease.js
 *
 * @param  {Object}  obj  object to test
 *
 * @return  {boolean}  true if interface (created through ease.js), otherwise
 *                     false
 */
module.exports.isInterface = function( obj )
{
    obj = obj || {};

    return ( obj.prototype instanceof Interface )
        ? true
        : false
    ;
};


/**
 * Default interface implementation
 *
 * @return  {undefined}
 */
function Interface() {}


var extend = ( function( extending )
{
    return function extend()
    {
        // ensure we'll be permitted to instantiate interfaces for the base
        extending = true;

        var args      = Array.prototype.slice.call( arguments ),
            props     = args.pop() || {},
            base      = args.pop() || Interface,
            prototype = new base(),

            members = member_builder.initMembers(
                prototype, prototype, prototype
            )
        ;

        // sanity check
        inheritCheck( prototype );

        var new_interface = createInterface();

        util.propParse( props, {
            property: function()
            {
                throw TypeError(
                    "Properties are not permitted within Interface " +
                        "definitions (did you forget the 'abstract' keyword?)"
                );
            },

            getter: function()
            {
                throw TypeError(
                    "Getters are not permitted within Interface definitions"
                );
            },

            setter: function()
            {
                throw TypeError(
                    "Setters are not permitted within Interface definitions"
                );
            },

            method: function( name, value, is_abstract, keywords )
            {
                if ( !is_abstract )
                {
                    throw TypeError(
                        "Only abstract methods are permitted within " +
                            "Interface definitions"
                    );
                }

                member_builder.buildMethod(
                    members, null, name, value, keywords
                );
            },
        } );

        attachExtend( new_interface );
        new_interface.prototype   = prototype;
        new_interface.constructor = new_interface;

        // freeze the interface (preventing additions), if supported
        util.freeze( new_interface );

        // we're done; let's not allow interfaces to be instantiated anymore
        extending = false;

        return new_interface;
    };


    /**
     * Creates a new interface constructor function
     *
     * @return  {function()}
     */
    function createInterface()
    {
        return function()
        {
            // allows us to extend the interface without throwing an exception
            // (since the prototype requires an instance)
            if ( !extending )
            {
                // only called if someone tries to create a new instance of an
                // interface
                throw Error( "Interfaces cannot be instantiated" );
            }
        };
    }
} )( false );


/**
 * Assures that the parent object is a valid object to inherit from
 *
 * This method allows inheriting from any object (note that it will likely cause
 * errors if not an interface), but will place restrictions on objects like
 * Classes that do not make sense to inherit from. This will provide a more
 * friendly error, with suggestions on how to resolve the issue, rather than a
 * cryptic error resulting from inheritance problems.
 *
 * This method will throw an exception if there is a violation.
 *
 * @param  {Object}  prototype  prototype to check for inheritance flaws
 *
 * @return  {undefined}
 */
function inheritCheck( prototype )
{
    // if we're inheriting from another interface, then we're good
    if ( prototype instanceof Interface )
    {
        return;
    }

    if ( Class.isClassInstance( prototype ) )
    {
        throw new TypeError(
            "Interfaces cannot extend from classes. Try creating an " +
                "abstract class instead."
        );
    }
}


/**
 * Attaches extend method to the given function (interface)
 *
 * @param  {Function}  func  function (interface) to attach method to
 *
 * @return  {undefined}
 */
function attachExtend( func )
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


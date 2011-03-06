/**
 * Contains property object generator
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


exports.setup = function( base, dest, properties, members )
{
    var prop_pub  = properties[ 'public' ],
        prop_prot = properties[ 'protected' ]
    ;

    // initialize each of the properties for this instance to
    // ensure we're not sharing references to prototype values
    for ( prop in prop_pub )
    {
        // initialize the value with a clone to ensure that they do
        // not share references (and therefore, data)
        base[ prop ] = util.clone( prop_pub[ prop ] );

        ( function( prop )
        {
            var inst = this;

            // public properties, when set internally, must forward to the
            // actual variable
            dest.__defineSetter__( prop, function( val )
            {
                inst[ prop ] = val;
            } );

            // since we're defining a setter, we'll need to define a getter
            // to return the value, or we'll simply return undefined
            dest.__defineGetter__( prop, function()
            {
                return inst[ prop ];
            } );
        } ).call( base, prop );
    }

    var methods_protected = members[ 'protected' ],
        hasOwn            = Array.prototype.hasOwnProperty
    ;

    // copy over the methods
    for ( method_name in methods_protected )
    {
        if ( hasOwn.call( methods_protected, method_name ) )
        {
            dest[ method_name ] = methods_protected[ method_name ];
        }
    }

    // initialize protected properties and store in instance data
    for ( prop in prop_prot )
    {
        dest[ prop ] = util.clone( prop_prot[ prop ] );
    }
}


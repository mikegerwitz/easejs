/**
 * Handles building of classes
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

var util           = require( __dirname + '/util' ),
    member_builder = require( __dirname + '/member_builder' )
;


exports.build = function(
    props, class_id, base, prop_init, abstract_methods, properties, members,
    getMethodInstance
)
{
    var hasOwn = Array.prototype.hasOwnProperty,
        defs   = {};

    util.propParse( props, {
        each: function( name, value, keywords )
        {
            // disallow use of our internal __initProps() method
            if ( name === '__initProps' )
            {
                throw new Error(
                    ( ( cname ) ? cname + '::' : '' ) +
                    "__initProps is a reserved method"
                );
            }

            // if a member was defined multiple times in the same class
            // declaration, throw an error
            if ( hasOwn.call( defs, name ) )
            {
                throw Error(
                    "Cannot redefine method '" + name + "' in same declaration"
                );
            }

            // keep track of the definitions (only during class declaration)
            // to catch duplicates
            defs[ name ] = 1;
        },

        property: function( name, value, keywords )
        {
            properties[ name ] = value;

            // build a new property, passing in the other members to compare
            // against for preventing nonsensical overrides
            member_builder.buildProp(
                prop_init, null, name, value, keywords, base
            );
        },

        getter: function( name, value, keywords )
        {
            member_builder.buildGetter(
                members, null, name, value, keywords
            );
        },

        setter: function( name, value, keywords )
        {
            member_builder.buildSetter(
                members, null, name, value, keywords
            );
        },

        method: function( name, func, is_abstract, keywords )
        {
            // constructor check
            if ( name === '__construct' )
            {
                if ( keywords[ 'protected' ] || keywords[ 'private' ] )
                {
                    throw TypeError( "Constructor must be public" );
                }
            }

            member_builder.buildMethod(
                members, null, name, func, keywords, getMethodInstance,
                class_id, base
            );

            if ( is_abstract )
            {
                abstract_methods[ name ] = true;
                abstract_methods.__length++;
            }
            else if ( ( hasOwn.call( abstract_methods, name ) )
                && ( is_abstract === false )
            )
            {
                // if this was a concrete method, then it should no longer
                // be marked as abstract
                delete abstract_methods[ name ];
                abstract_methods.__length--;
            }
        },
    } );
};

# Included in full combined file for test cases
#
#  Copyright (C) 2010 Mike Gerwitz
#
#  This file is part of ease.js.
#
#  ease.js is free software: you can redistribute it and/or modify it under the
#  terms of the GNU Lesser General Public License as published by the Free
#  Software Foundation, either version 3 of the License, or (at your option)
#  any later version.
#
#  This program is distributed in the hope that it will be useful, but WITHOUT
#  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
#  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
#  for more details.
#
#  You should have received a copy of the GNU Lesser General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
# #

exports.common = {
    require: function ( id )
    {
        return require( id );
    }
};


/**
 * Bare-bones implementation of node.js assert module
 *
 * This contains only the used assertions
 */
exports.assert = {
    equal: function ( val, cmp, err )
    {
        if ( val !== cmp )
        {
            throw Error( err );
        }
    },


    notEqual: function ( val, cmp, err )
    {
        if ( val === cmp )
        {
            throw Error( err );
        }
    },


    deepEqual: function ( val, cmp, err )
    {
        // todo: not yet implemented
    },


    ok: function ( result, err )
    {
        if ( !result )
        {
            throw Error( err );
        }
    },


    throws: function ( test, expected, err )
    {
        try
        {
            test();
        }
        catch ( e )
        {
            if ( !( e instanceof expected ) )
            {
                throw Error( err );
            }
        }
    },


    doesNotThrow: function ( test, not_expected, err )
    {
        try
        {
            test();
        }
        catch ( e )
        {
            if ( e instanceof not_expected )
            {
                throw Error( err );
            }
        }
    },
};


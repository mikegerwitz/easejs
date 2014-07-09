# Included in full combined file for test cases
#
#  Copyright (C) 2010, 2011, 2013, 2014 Free Software Foundation, Inc.
#
#  This file is part of GNU ease.js.
#
#  ease.js is free software: you can redistribute it and/or modify it under
#  the terms of the GNU General Public License as published by the Free
#  Software Foundation, either version 3 of the License, or (at your option)
#  any later version.
#
#  This program is distributed in the hope that it will be useful, but
#  WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General
#  Public License for more details.
#
#  You should have received a copy of the GNU General Public License along
#  with this program.  If not, see <http://www.gnu.org/licenses/>.
# #

module.common = module['test/common'] = { exports: {
    require: function ( id )
    {
        return require( id );
    },

    testCase: function()
    {
        return require( '/test/inc-testcase' ).apply( this, arguments );
    }
} };


function failAssertion( err )
{
    throw Error( 'Assertion failed: ' + ( err || '(no failure message)' ) );
}


/**
 * Bare-bones implementation of node.js assert module
 *
 * This contains only the used assertions
 */
module.assert = { exports: {
    equal: function ( val, cmp, err )
    {
        if ( val != cmp )
        {
            failAssertion( err );
        }
    },


    strictEqual: function( val, cmp, err )
    {
        if ( val !== cmp )
        {
            failAssertion( err );
        }
    },


    notStrictEqual: function( val, cmp, err )
    {
        if ( val === cmp )
        {
            failAssertion( err );
        }
    },


    notEqual: function ( val, cmp, err )
    {
        if ( val === cmp )
        {
            failAssertion( err );
        }
    },


    // dumbed down impl which works for what we use
    deepEqual: function ( val, cmp, err )
    {
        if ( val == cmp )
        {
            return;
        }

        if ( ( cmp instanceof Array ) && ( val instanceof Array ) )
        {
            var i   = 0,
                len = cmp.length;

            for ( ; i < len; i++ )
            {
                // recurse
                module.assert.exports.deepEqual( val[ i ], cmp[ i ], err );
            }

            return;
        }
        else if ( ( typeof cmp === 'object' ) && ( typeof val === 'object' ) )
        {
            for ( var i in cmp )
            {
                // recurse
                module.assert.exports.deepEqual( val[ i ], cmp[ i ], err );
            }

            return;
        }

        failAssertion( err );
    },


    ok: function ( result, err )
    {
        if ( !result )
        {
            failAssertion( err );
        }
    },


    fail: function ( err )
    {
        failAssertion( err );
    },


    'throws': function ( test, expected, err )
    {
        expected = expected || Error;

        try
        {
            test();
        }
        catch ( e )
        {
            if ( !( e instanceof expected ) )
            {
                failAssertion( err );
            }
        }
    },


    doesNotThrow: function ( test, not_expected, err )
    {
        not_expected = not_expected || Error;

        try
        {
            test();
        }
        catch ( e )
        {
            if ( e instanceof not_expected )
            {
                failAssertion( err );
            }
        }
    },
} };


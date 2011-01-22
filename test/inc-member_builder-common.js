/**
 * Common functions for member_builder tests
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
 * @package test
 */

var common    = require( './common' ),
    assert    = require( 'assert' )
;

exports.members = {};
exports.meta    = {};
exports.name    = 'foo';
exports.value   = { bar: 'baz' };

exports.buildMember = null;


/**
 * Partially applied function to quickly build properties using common test data
 */
exports.buildMemberQuick = function( keywords )
{
    keywords = keywords || {};

    // clear out the members for a fresh start
    exports.members = { 'public': {}, 'protected': {}, 'private': {} };

    return exports.buildMember(
        exports.members,
        exports.meta,
        exports.name,
        exports.value,
        keywords
    );
}


/**
 * Asserts that the given property exists only in the prototype for the
 * requested visibility
 */
exports.assertOnlyVisibility = function( vis, name, value, message )
{
    var check = [ 'public', 'protected', 'private' ],
        i     = check.length,
        visi  = '',
        cmp;

    // forEach not used for pre-ES5 browser support
    while ( i-- )
    {
        visi = check[ i ];
        cmp  = ( visi === vis ) ? value : undefined;

        assert.deepEqual(
            exports.members[ visi ][ name ],
            cmp,
            message
        );
    }
}


exports.assertCommon = function()
{
    ( function testRecognizesPublicProperty()
    {
        exports.buildMemberQuick( { 'public': true } );

        exports.assertOnlyVisibility( 'public',
            exports.name,
            exports.value,
            "Public properties are copied only to the public member prototype"
        );
    } )();


    ( function testRecognizesProtectedProperty()
    {
        exports.buildMemberQuick( { 'protected': true } );

        exports.assertOnlyVisibility( 'protected',
            exports.name,
            exports.value,
            "Protected properties are copied only to the protected member " +
                " prototype"
        );
    } )();


    ( function testRecognizesPrivateProperty()
    {
        exports.buildMemberQuick( { 'private': true } );

        exports.assertOnlyVisibility( 'private',
            exports.name,
            exports.value,
            "Private properties are copied only to the private member prototype"
        );
    } )();


    ( function testCopiedIntoPublicPrototypeByDefault()
    {
        exports.buildMemberQuick();

        exports.assertOnlyVisibility( 'public',
            exports.name,
            exports.value,
            "Properties are copied only to the public member prototype by " +
                "default"
        );
    } )();


    ( function testThrowsTypeErrorIfMultipleVisibilityKeywordsAreGiven()
    {
        assert.throws( function()
        {
            exports.buildMemberQuick( {
                'public':    true,
                'protected': true,
            } );
        }, TypeError, "Cannot specify multiple visibility keywords (0)" );

        assert.throws( function()
        {
            exports.buildMemberQuick( {
                'public':  true,
                'private': true,
            } );
        }, TypeError, "Cannot specify multiple visibility keywords (1)" );

        assert.throws( function()
        {
            exports.buildMemberQuick( {
                'protected': true,
                'private':   true,
            } );
        }, TypeError, "Cannot specify multiple visibility keywords (2)" );
    } )();
};


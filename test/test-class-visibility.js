/**
 * Tests class member visibility (public, private, protected)
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

var common = require( './common' ),
    assert = require( 'assert' ),
    Class  = common.require( 'class' ),

    pub  = 'foo',
    prot = 'bar',
    priv = 'baz',

    pubf  = function() { return pub; },
    protf = function() { return prot; },
    privf = function() { return priv; },

    // new anonymous class instance
    foo = Class.extend( {
        'public pub':      pub,
        'protected peeps': prot,
        'private parts':   priv,

        'public pubf':     pubf,
        'protected protf': protf,
        'private privf':   privf,

        'public getProp': function( name )
        {
            // return property, allowing us to break encapsulation for
            // protected/private properties (for testing purposes)
            return this[ name ];
        },
    })();


( function testPublicMembersAreAccessbileExternally()
{
    assert.equal(
        foo.pub,
        pub,
        "Public properties are accessible via public interface"
    );

    assert.equal(
        foo.pubf(),
        pub,
        "Public methods are accessible via public interface"
    );
} )();


( function testProtectedAndPrivateMembersAreNotAccessibleExternally()
{
    assert.equal(
        foo.peeps,
        undefined,
        "Protected properties are inaccessible via public interface"
    );

    assert.equal(
        foo.parts,
        undefined,
        "Private properties are inaccessible via public interface"
    );

    assert.equal(
        foo.protf,
        undefined,
        "Protected methods are inaccessible via public interface"
    );

    assert.equal(
        foo.privf,
        undefined,
        "Private methods are inaccessible via public interface"
    );
} )();


/**
 * Protected members should be accessible from within class methods
 */
( function testProtectedMembersAreAccessibleInternally()
{
    assert.equal(
        foo.getProp( 'peeps' ),
        prot,
        "Protected properties are available internally"
    );

    // invoke rather than checking for equality, because the method may be
    // wrapped
    assert.equal(
        foo.getProp( 'protf' )(),
        prot,
        "Protected methods are available internally"
    );
} )();


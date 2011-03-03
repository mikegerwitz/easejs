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


        /**
         * Allows us to set a value from within the class
         */
        'public setValue': function( name, value )
        {
            this[ name ] = value;
        },
    })();


/**
 * Public members are the only members added to the instance's prototype to be
 * accessible externally
 */
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


/**
 * For reasons that are discussed in the next test (writing to public
 * properties), we need to make sure public members are available internally.
 * Actually, we don't need to test public methods, really, but it's in there for
 * good measure. Who knows what bugs may be introduced in the future.
 *
 * This ensures that the getter is properly proxying the value to us.
 */
( function testPublicMembersAreAccessibleInternally()
{
    assert.equal(
        foo.getProp( 'pub' ),
        pub,
        "Public properties are accessible internally"
    );

    assert.equal(
        foo.getProp( 'pubf' )(),
        pub,
        "Public methods are accessible internally"
    );
} )();


/**
 * This may sound like an odd test, but it's actually very important. Due to how
 * private/protected members are implemented, it compromises public members. In
 * fact, public members would not work internally without what is essentially a
 * proxy via setters.
 *
 * This test is to ensure that the setter is properly forwarding writes to the
 * object within the prototype chain containing the public values. Otherwise,
 * setting the value would simply mask it in the prototype chain. The value
 * would appear to have changed internally, but when accessed externally, the
 * value would still be the same. That would obviously be a problem ;)
 */
( function testPublicPropertiesAreWritableInternally()
{
    var val = 'moomookittypoo';

    // start by setting the value
    foo.setValue( 'pub', val );

    // we should see that change internally...
    assert.equal(
        foo.getProp( 'pub' ),
        val,
        "Setting the value of a public property internally should be " +
            "observable /internally/"
    );

    // ...as well as externally
    assert.equal(
        foo.pub,
        val,
        "Setting the value of a public property internally should be " +
            "observable /externally/"
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


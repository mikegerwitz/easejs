/**
 * Tests visibility object factory
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
    assert = require( 'assert' );

// we cannot perform these tests if it's not supported by our environment
if ( common.require( 'util' ).definePropertyFallback() )
{
    return;
}

    // SUT
var VisibilityObjectFactory = common.require( 'VisibilityObjectFactory' ),

    sut = VisibilityObjectFactory(),

    // properties are expected to be in a specific format
    props = {
        'public': {
            pub: [ [ 'foo' ], {} ],
        },
        'protected': {
            prot: [ [ 'bar' ], {} ],
        },
        'private': {
            priv: [ [ 'baz' ], {} ],
        },
    },

    methods = {
        'public': {
            fpub: ( function()
            {
                var retval = function() {};
                retval.___$$keywords$$ = { 'public': true };

                return retval;
            } )(),
        },
        'protected': {
            fprot: function() {},
        },
        'private': {
            fpriv: function() {},
        },
    }
;


/**
 * To keep with the spirit of ease.js, we should be able to instantiate
 * VisibilityObjectFactory both with and without the 'new' keyword
 *
 * Consistency is key with these sorts of things.
 */
( function testCanInstantiateWithAndWithoutNewKeyword()
{
    // with 'new' keyword
    assert.ok(
        ( new VisibilityObjectFactory() ) instanceof VisibilityObjectFactory,
        "Should be able to instantiate VisibilityObjectFactory with 'new' " +
            "keyword"
    );

    // without 'new' keyword
    assert.ok( VisibilityObjectFactory() instanceof VisibilityObjectFactory,
        "Should be able to instantiate VisibilityObjectFactory without 'new' " +
            "keyword"
    );
} )();


/**
 * One of the core requirements for proper visibility support is the ability to
 * create a proxy object. Proxy objects transfer gets/sets of a certain property
 * to another object. This allows objects to be layered atop each other while
 * still permitting gets/sets to fall through.
 */
( function testCanCreatePropertyProxy()
{
    var base  = {},
        dest  = {},
        props = { one: true, two: true, three: true },
        val   = 'foo',
        val2  = 'bar'
    ;

    // create proxy of props to base on dest
    sut.createPropProxy( base, dest, props );

    // check to ensure the properties are properly proxied
    for ( prop in props )
    {
        dest[ prop ] = val;

        // check proxy
        assert.equal( dest[ prop ], val,
            "Property can be set/retrieved on destination object"
        );

        // check base
        assert.equal( base[ prop ], val,
            "Property can be set via proxy and retrieved on base"
        );

        // set to new value
        base[ prop ] = val2;

        // re-check proxy
        assert.equal( dest[ prop ], val2,
            "Property can be set on base and retrieved on dest object"
        );
    }
} )();


/**
 * An additional layer should be created, which will hold the private members.
 */
( function testSetupCreatesPrivateLayer()
{
    var dest = { foo: [] },
        obj  = sut.setup( dest, props, methods );

    assert.notEqual( obj, dest,
        "Returned object should not be the destination object"
    );

    assert.strictEqual( obj.foo, dest.foo,
        "Destination object is part of the prototype chain of the returned obj"
    );
} )();


/**
 * All protected properties must be proxied from the private layer to the
 * protected. Otherwise, sets would occur on the private object, which would
 * prevent them from being accessed by subtypes if set by a parent method
 * invocation. (The same is true in reverse.)
 */
( function testPrivateLayerIncludesProtectedMemberProxy()
{
    var dest = {},
        obj  = sut.setup( dest, props, methods ),
        val  = 'foo'
    ;

    obj.prot = val;
    assert.equal( dest.prot, val,
        "Protected values are proxied from private layer"
    );
} )();


/**
 * Public properties should be initialized on the destination object to ensure
 * that references are not shared between instances (that'd be a pretty nasty
 * bug).
 *
 * Note that we do not care about public methods, because they're assumed to
 * already be part of the prototype chain. The visibility object is only
 * intended to handle levels of visibility that are not directly implemented in
 * JS. Public methods are a direct consequence of adding a property to the
 * prototype chain.
 */
( function testPublicPropertiesAreCopiedToDestinationObject()
{
    var dest = {};
    sut.setup( dest, props, methods );

    // values should match
    assert.equal( dest.pub[ 0 ], props[ 'public' ].pub[ 0 ],
        "Public properties are properly initialized"
    );

    // ensure references are not shared (should be cloned)
    assert.notStrictEqual( dest.pub, props[ 'public' ].pub,
        "Public properties should not be copied by reference"
    );

    // method references should NOT be transferred (they're assumed to already
    // be a part of the prototype chain, since they're outside the scope of the
    // visibility object)
    assert.equal( dest.fpub, undefined,
        "Public method references should not be copied"
    );
} )();


/**
 * Protected properties should be copied over for the same reason that public
 * properties should, in addition to the fact that the protected members are not
 * likely to be present on the destination object. In addition, methods will be
 * copied over.
 */
( function testProtectedPropertiesAndMethodsAreAddedToDestinationObject()
{
    var dest = {};
    sut.setup( dest, props, methods );

    // values should match
    assert.equal( dest.prot[ 0 ], props[ 'protected' ].prot[ 0 ],
        "Protected properties are properly initialized"
    );

    // ensure references are not shared (should be cloned)
    assert.notStrictEqual( dest.prot, props[ 'protected' ].prot,
        "Protected properties should not be copied by reference"
    );

    // protected method references should be copied
    assert.strictEqual( dest.fprot, methods[ 'protected' ].fprot,
        "Protected members should be copied by reference"
    );
} )();


/**
 * Public members should *always* take precedence over protected. The reason for
 * this is because, if a protected member is overridden and made public by a
 * subtype, we need to ensure that the protected member of the supertype doesn't
 * take precedence. The reason it would take precedence by default is because
 * the protected visibility object is laid *atop* the public, meaning it comes
 * first in the prototype chain.
 */
( function testPublicMethodsAreNotOverwrittenByProtected()
{
    // use the public method
    var dest = { fpub: methods[ 'public' ].fpub };

    // add duplicate method to protected
    methods[ 'protected' ].fpub = function() {};

    sut.setup( dest, props, methods );

    // ensure our public method is still referenced
    assert.strictEqual( dest.fpub, methods[ 'public' ].fpub,
        "Public methods should not be overwritten by protected methods"
    );
} )();


/**
 * Same situation with private members as protected, with the exception that we
 * do not need to worry about the overlay problem (in regards to methods). This
 * is simply because private members are not inherited.
 */
( function testPrivatePropertiesAndMethodsAreAddedToDestinationObject()
{
    var dest = {},
        obj  = sut.setup( dest, props, methods );

    // values should match
    assert.equal( obj.priv[ 0 ], props[ 'private' ].priv[ 0 ],
        "Private properties are properly initialized"
    );

    // ensure references are not shared (should be cloned)
    assert.notStrictEqual( obj.priv, props[ 'private' ].priv,
        "Private properties should not be copied by reference"
    );

    // private method references should be copied
    assert.strictEqual( obj.fpriv, methods[ 'private' ].fpriv,
        "Private members should be copied by reference"
    );
} )();


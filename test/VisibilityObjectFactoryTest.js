/**
 * Tests visibility object factory
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut = this.require( 'VisibilityObjectFactory' );

        // properties are expected to be in a specific format
        this.props = {
            'public': {
                pub: [ [ 'foo' ], {} ],
            },
            'protected': {
                prot: [ [ 'bar' ], {} ],
            },
            'private': {
                priv: [ [ 'baz' ], {} ],
            },
        };

        this.methods = {
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
        };
    },


    setUp: function()
    {
        // we cannot perform these tests if they are not supported by our
        // environment
        if ( this.require( 'util' ).definePropertyFallback() )
        {
            this.skip();
        }

        this.sut = this.Sut();
    },


    /**
     * To keep with the spirit of ease.js, we should be able to instantiate
     * VisibilityObjectFactory both with and without the 'new' keyword
     *
     * Consistency is key with these sorts of things.
     */
    'Can instantiate with and without `new` keyword': function()
    {
        // with `new` keyword
        this.assertOk(
            ( new this.Sut() ) instanceof this.Sut,
            "Should be able to instantiate VisibilityObjectFactory with " +
                "'new' keyword"
        );

        // without `new` keyword
        this.assertOk( this.Sut() instanceof this.Sut,
            "Should be able to instantiate VisibilityObjectFactory without " +
                "'new' keyword"
        );
    },


    /**
     * One of the core requirements for proper visibility support is the ability
     * to create a proxy object. Proxy objects transfer gets/sets of a certain
     * property to another object. This allows objects to be layered atop each
     * other while still permitting gets/sets to fall through.
     */
    'Can create property proxy': function()
    {
        var _self = this,
            base  = {},
            dest  = {},
            props = { one: true, two: true, three: true },
            val   = 'foo',
            val2  = 'bar'
        ;

        // create proxy of props to base on dest
        this.sut.createPropProxy( base, dest, props );

        // check to ensure the properties are properly proxied
        for ( var prop in props )
        {
            dest[ prop ] = val;

            // check proxy
            _self.assertEqual( dest[ prop ], val,
                "Property can be set/retrieved on destination object"
            );

            // check base
            _self.assertEqual( base[ prop ], val,
                "Property can be set via proxy and retrieved on base"
            );

            // set to new value
            base[ prop ] = val2;

            // re-check proxy
            _self.assertEqual( dest[ prop ], val2,
                "Property can be set on base and retrieved on dest object"
            );
        }
    },


    /**
     * An additional layer should be created, which will hold the private
     * members.
     */
    'Setup creates private layer': function()
    {
        var dest = { foo: [] },
            obj  = this.sut.setup( dest, this.props, this.methods );

        this.assertNotEqual( obj, dest,
            "Returned object should not be the destination object"
        );

        this.assertStrictEqual( obj.foo, dest.foo,
            "Destination object is part of the prototype chain of the " +
                "returned obj"
        );
    },


    /**
     * All protected properties must be proxied from the private layer to the
     * protected. Otherwise, sets would occur on the private object, which would
     * prevent them from being accessed by subtypes if set by a parent method
     * invocation. (The same is true in reverse.)
     */
    'Private layer includes protected member proxy': function()
    {
        var dest = {},
            obj  = this.sut.setup( dest, this.props, this.methods ),
            val  = 'foo'
        ;

        obj.prot = val;
        this.assertEqual( dest.prot, val,
            "Protected values are proxied from private layer"
        );
    },


    /**
     * Public properties should be initialized on the destination object to
     * ensure that references are not shared between instances (that'd be a
     * pretty nasty bug).
     *
     * Note that we do not care about public methods, because they're assumed to
     * already be part of the prototype chain. The visibility object is only
     * intended to handle levels of visibility that are not directly implemented
     * in JS. Public methods are a direct consequence of adding a property to
     * the prototype chain.
     */
    'Public properties are copied to destination object': function()
    {
        var dest = {};
        this.sut.setup( dest, this.props, this.methods );

        // values should match
        this.assertEqual( dest.pub[ 0 ], this.props[ 'public' ].pub[ 0 ],
            "Public properties are properly initialized"
        );

        // ensure references are not shared (should be cloned)
        this.assertNotStrictEqual( dest.pub, this.props[ 'public' ].pub,
            "Public properties should not be copied by reference"
        );

        // method references should NOT be transferred (they're assumed to
        // already be a part of the prototype chain, since they're outside the
        // scope of the visibility object)
        this.assertEqual( dest.fpub, undefined,
            "Public method references should not be copied"
        );
    },


    /**
     * Protected properties should be copied over for the same reason that
     * public properties should, in addition to the fact that the protected
     * members are not likely to be present on the destination object. In
     * addition, methods will be copied over.
     */
    'Protected properties and methods are added to dest object': function()
    {
        var dest = {};
        this.sut.setup( dest, this.props, this.methods );

        // values should match
        this.assertEqual( dest.prot[ 0 ], this.props[ 'protected' ].prot[ 0 ],
            "Protected properties are properly initialized"
        );

        // ensure references are not shared (should be cloned)
        this.assertNotStrictEqual( dest.prot, this.props[ 'protected' ].prot,
            "Protected properties should not be copied by reference"
        );

        // protected method references should be copied
        this.assertStrictEqual( dest.fprot, this.methods[ 'protected' ].fprot,
            "Protected members should be copied by reference"
        );
    },


    /**
     * Public members should *always* take precedence over protected. The reason
     * for this is because, if a protected member is overridden and made public
     * by a subtype, we need to ensure that the protected member of the
     * supertype doesn't take precedence. The reason it would take precedence by
     * default is because the protected visibility object is laid *atop* the
     * public, meaning it comes first in the prototype chain.
     */
    'Public methods are not overwritten by default': function()
    {
        // use the public method
        var dest = { fpub: this.methods[ 'public' ].fpub };

        // add duplicate method to protected
        this.methods[ 'protected' ].fpub = function() {};

        this.sut.setup( dest, this.props, this.methods );

        // ensure our public method is still referenced
        this.assertStrictEqual( dest.fpub, this.methods[ 'public' ].fpub,
            "Public methods should not be overwritten by protected methods"
        );
    },


    /**
     * This test addresses a particularily nasty bug that wasted hours of
     * development time: When a visibility modifier keyword is omitted, then
     * it should be implicitly public. In this case, however, the keyword is
     * not automatically added to the keyword list (maybe one day it will
     * be, but for now we'll maintain the distinction); therefore, we should
     * not be checking for the `public' keyword when determining if we
     * should write to the protected member object.
     */
    'Public methods are not overwritten when keyword is omitted': function()
    {
        var f = function() {};
        f.___$$keywords$$ = {};

        // no keywords; should be implicitly public
        var dest = { fpub: f };

        // add duplicate method to protected
        this.methods[ 'protected' ].fpub = function() {};

        this.sut.setup( dest, this.props, this.methods );

        // ensure our public method is still referenced
        this.assertStrictEqual( dest.fpub, f,
            "Public methods should not be overwritten by protected methods"
        );
    },



    /**
     * Same situation with private members as protected, with the exception that
     * we do not need to worry about the overlay problem (in regards to
     * methods). This is simply because private members are not inherited.
     */
    'Private properties and methods are added to dest object': function()
    {
        var dest = {},
            obj  = this.sut.setup( dest, this.props, this.methods );

        // values should match
        this.assertEqual( obj.priv[ 0 ], this.props[ 'private' ].priv[ 0 ],
            "Private properties are properly initialized"
        );

        // ensure references are not shared (should be cloned)
        this.assertNotStrictEqual( obj.priv, this.props[ 'private' ].priv,
            "Private properties should not be copied by reference"
        );

        // private method references should be copied
        this.assertStrictEqual( obj.fpriv, this.methods[ 'private' ].fpriv,
            "Private members should be copied by reference"
        );
    },
} );

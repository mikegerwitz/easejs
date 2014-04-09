/**
 * Tests class getter/setter inheritance
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
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
        this.Sut  = this.require( 'class' );
        this.util = this.require( 'util' );
    },


    setUp: function()
    {
        // don't perform these tests if getters/setters are unsupported
        if ( this.util.definePropertyFallback() )
        {
            this.skip();
        }

        var foo_def     = {},
            sub_foo_def = {};

        // to prevent syntax errors in environments that do not support
        // getters/setters in object notation
        Object.defineProperty( foo_def, 'foo', {
            get: function ()
            {
                return this._foo;
            },
            set: function ( val )
            {
                this._foo = ''+( val );
            },

            enumerable: true,
        } );

        Object.defineProperty( foo_def, 'virtual bar', {
            get: function ()
            {
                return 'durp';
            },
            set: function ( val )
            {
            },

            enumerable: true,
        } );

        Object.defineProperty( sub_foo_def, 'override bar', {
            get: function ()
            {
                return this.bar2;
            },
            set: function ( val )
            {
                this.bar2 = val;
            },

            enumerable: true,
        } );

        // this is important since the system may freeze the object, so we
        // must have declared it in advance
        foo_def.bar2 = '';

        var Foo    = this.Sut.extend( foo_def ),
            SubFoo = Foo.extend( sub_foo_def );

        this.sub = new SubFoo();
    },


    /**
     * Getters/setters should be inherited from the prototype as-is (if this
     * doesn't work, someone went out of their way to break it, as it works
     * by default!)
     */
    'Subtypes inherit getters/setters': function()
    {
        var val = 'foo';

        this.sub.foo = val;
        this.assertEqual( this.sub.foo, val );
    },


    /**
     * Just as methods can be overridden, so should getters/setters, which
     * act as methods do.
     */
    'Subtypes should be able to override getters/setters': function()
    {
        var val = 'bar';

        this.sub.bar = val;
        this.assertEqual( this.sub.bar, val );
        this.assertEqual( this.sub.bar2, val );
    },
} );

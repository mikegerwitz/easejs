/**
 * Tests global scope handling
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

var _global = this;

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut  = this.require( 'util/Global' );
        this.gobj = this.Sut.expose();
        this.uniq = '___$$easejs$globaltest$$';
    },


    /**
     * Check common environments and ensure that the returned object is
     * strictly equal to the global object for that environment. For
     * environments that we do *not* know about, just check for a common
     * object that must exist in ES3 and above.
     */
    'Global object represents environment global object': function()
    {
        switch ( true )
        {
            // browser
            case _global.window:
                this.assertStrictEqual( this.gobj, _global.window );
                break;

            // Node.js
            case _global.root:
                this.assertStrictEqual( this.gobj, _global.root );
                break;

            // something else; we'll just check for something that should
            // exist in >=ES3
            default:
                this.assertStrictEqual( this.gobj.Array, Array );
        }
    },


    /**
     * Since ease.js makes use of ECMAScript features when they are
     * available, it must also find a way to gracefully degrade to support
     * less fortunate environments; the ability to define alternative
     * definitions is key to that.
     */
    'Providing alternative will set value if name does not exist':
    function()
    {
        var sut = this.Sut();

        var field = this.uniq,
            value = { _: 'easejsOK' };

        sut.provideAlt( field, function() { return value; } );
        this.assertStrictEqual( sut.get( field ), value );
    },


    /**
     * It is also important that our own definitions do not pollute the
     * global scope; reasons for this are not just to be polite, but also
     * because other code/libraries may provide their own definitions that
     * we would not want to interfere with. (Indeed, we'd also want to use
     * those definitions, if they already exist before provideAlt is
     * called.)
     */
    'Providing alternative will not pollute the global scope': function()
    {
        this.Sut().provideAlt( this.uniq, function() { return {} } );
        this.assertEqual( this.gobj[ this.uniq ], undefined );
    },


    /**
     * Our alternatives are unneeded if the object we are providing an
     * alternative for is already defined.
     */
    'Providing alternative will not modify global if name exists':
    function()
    {
        var sut = this.Sut();

        // a field that must exist in ES3+
        var field = 'Array',
            orig  = this.gobj[ field ];

        sut.provideAlt( field, function() { return {}; } );
        this.assertStrictEqual( sut.get( field ), orig );
    },


    /**
     * Once an alternative is defined, it shall be treated as though the
     * value were defined globally; providing additional alternatives should
     * therefore have no effect.
     */
    'Providing alternative twice will not modify first alternative':
    function()
    {
        var sut      = this.Sut();
            field    = this.uniq,
            expected = { _: 'easejsOK' };

        // first should provide alternative, second should do nothing
        sut.provideAlt( field, function() { return expected; } );
        sut.provideAlt( field, function() { return 'oops'; } );

        this.assertStrictEqual( sut.get( field ), expected );
    },


    'provideAlt returns self for method chaining': function()
    {
        var sut = this.Sut();

        this.assertStrictEqual( sut,
            sut.provideAlt( 'foo', function() {} )
        );
    },
} );


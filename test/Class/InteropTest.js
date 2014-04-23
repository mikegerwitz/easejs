/**
 * Tests class interoperability with vanilla ECMAScript
 *
 *  Copyright (C) 2014 Mike Gerwitz
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
 *
 * Note that these tests all use the `new' keyword for instantiating
 * classes, even though it is not required with ease.js; this is both for
 * historical reasons (when `new' was required during early development) and
 * because we are not testing (and do want to depend upon) that feature.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Class = this.require( 'class' );
    },


    /**
     * While this may seem at odds with ease.js' philosophy (because ease.js
     * methods are *not* virtual by default), we do not have much choice in
     * the matter: JavaScript is very lax and does not offer a way to
     * declare something as virtual or otherwise. Given that, we have to
     * choose between implicit virtual methods, or never allowing the user
     * to override methods inherited from a prototype. The latter is not a
     * wise choice, since there would be no way to change that behavior.
     *
     * Of course, if such a distinction were important, a wrapper class
     * could be created that simply extends the prototype, marks methods
     * virtual as appropriate, and retain only that reference for use from
     * that point forward.
     */
    'Methods inherited from a prototype are implicitly virtual': function()
    {
        var expected = {};

        var P = function()
        {
            this.foo = function()
            {
                return null;
            };
        }

        var Class = this.Class,
            inst;

        // if an error is thrown here, then we're probably not virtual
        this.assertDoesNotThrow( function()
        {
            inst = Class.extend( P,
            {
                'override foo': function()
                {
                    return expected;
                }
            } )();
        } );

        // the sky is falling if the above worked but this didn't
        this.assertStrictEqual( inst.foo(), expected );
    },


    /**
     * Complement to the above test.
     */
    'Prototype method overrides must provide override keyword': function()
    {
        var P = function()
        {
            this.foo = function() {};
        };

        var Class = this.Class;
        this.assertThrows( function()
        {
            Class.extend( P,
            {
                // missing override keyword
                foo: function() {},
            } );
        } );
    },
} );


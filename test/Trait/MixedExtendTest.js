/**
 * Tests extending a class that mixes in traits
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
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut   = this.require( 'Trait' );
        this.Class = this.require( 'class' );
    },


    /**
     * The supertype should continue to work as it would without the
     * subtype, which means that the supertype's traits should still be
     * available. Note that ease.js does not (at least at the time of
     * writing this test) check to see if a trait is no longer accessible
     * due to overrides, and so a supertype's traits will always be
     * instantiated.
     */
    'Subtype instantiates traits of supertype': function()
    {
        var called = false;

        var T = this.Sut(
        {
            foo: function() { called = true; },
        } );

        // C is a subtype of a class that mixes in T
        var C = this.Class.use( T ).extend( {} )
            .extend(
            {
                // ensure that there is no ctor-dependent trait stuff
                __construct: function() {},
            } );

        C().foo();
        this.assertOk( called );
    },
} );

/**
 * Tests fallback visibility object factory
 *
 *  Copyright (C) 2011, 2012, 2013 Free Software Foundation, Inc.
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
        this.Sut = this.require( 'FallbackVisibilityObjectFactory' );

        // parent of SUT
        this.VisibilityObjectFactory =
            this.require( 'VisibilityObjectFactory' );

        this.props = this.methods = {
            'public':    {},
            'protected': {},
            'private':   {},
        };
    },


    /**
     * To keep with the spirit of ease.js, we should be able to instantiate
     * VisibilityObjectFactory both with and without the 'new' keyword
     *
     * Consistency is key with these sorts of things.
     */
    'Can instantiate with and without `new` keyword': function()
    {
        // with 'new' keyword
        this.assertOk(
            ( new this.Sut() ) instanceof this.Sut,
            "Should be able to instantiate FallbackVisibilityObjectFactory " +
            "with 'new' keyword"
        );

        // without 'new' keyword
        this.assertOk(
            this.Sut() instanceof this.Sut,
            "Should be able to instantiate FallbackVisibilityObjectFactory " +
                "without 'new' keyword"
        );
    },


    /**
     * VisibilityObjectFactory should be part of our prototype chain.
     */
    'Inherits from visibility object factory': function()
    {
        // check an instance, rather than __proto__, because older engines do
        // not support it
        this.assertOk(
            this.Sut() instanceof this.VisibilityObjectFactory,
            "Fallback should inherit from VisibilityObjectFactory"
        );
    },


    /**
     * We're falling back because we do not support the private visibility layer
     * (or any layers, for that matter). Ensure it's not created.
     */
    'Setup method should not add private layer': function()
    {
        var dest = {},
            obj  = this.Sut().setup( dest, this.props, this.methods );

        this.assertStrictEqual( dest, obj,
            "Private visibility layer is not added atop destination"
        );
    },


    /**
     * Getters/setters are unsupported (thus the fallback).
     */
    'Creating property proxy should simply return self': function()
    {
        var base = {},
            dest = {};

        this.assertStrictEqual(
            this.Sut().createPropProxy( base, dest, this.props ),
            base,
            "Creating property proxy should simply return original object"
        );
    },
} );


/**
 * Tests interfaces
 *
 *  Copyright (C) 2011, 2013 Free Software Foundation, Inc.
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
    setUp: function()
    {
        this.FooType = this.require( 'interface' ).extend();
    },


    /**
     * Interface.extend(), like Class.extend(), should result in a new
     * interface.
     */
    'Interface extend method creates a new interface object': function()
    {
        this.assertOk(
            ( typeof this.FooType === 'function' ),
            "Interface extend method creates a new interface object"
        );
    },


    /**
     * Interfaces describe an API; they do not have any actual implementation.
     * It does not make sense to instantiate them.
     */
    'Interfaces cannot be instantiated': function()
    {
        this.assertThrows( function()
        {
            new this.FooType();
        }, Error, "Should not be able to instantiate interfaces" );
    },


    /**
     * To prevent altering the interface after it is defined, the resulting
     * object should be frozen, if supported by the environment.
     */
    'Generated interface should be frozen': function()
    {
        // only perform the assertion if supported by our environment
        if ( Object.isFrozen )
        {
            this.assertEqual(
                Object.isFrozen( this.FooType ),
                true,
                "Generated interface object should be frozen"
            );
        }
    },
} );

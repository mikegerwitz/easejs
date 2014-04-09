/**
 * Tests index.js
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
        this.Sut = this.require( '../' );

        this.exportedAs = function( name, module )
        {
            this.assertStrictEqual(
                this.Sut[ name ],
                this.require( module )
            );
        };
    },


    /**
     * Simply check the exports to ensure that everything is available that
     * should be.
     */
    'Class module is exported as `Class\'': function()
    {
        this.exportedAs( 'Class', 'class' );
    },
    'Abstract class module is exported as `AbstractClass\'': function()
    {
        this.exportedAs( 'AbstractClass', 'class_abstract' );
    },
    'Final class module is exported as `FinalClass\'': function()
    {
        this.exportedAs( 'FinalClass', 'class_final' );
    },
    'Interface module is exported as `Interface\'': function()
    {
        this.exportedAs( 'Interface', 'interface' );
    },
    'Trait module is exported as `Trait\'': function()
    {
        this.exportedAs( 'Trait', 'Trait' );
    },
    'Version information is exported as `version\'': function()
    {
        this.exportedAs( 'version', 'version' );
    },
} );

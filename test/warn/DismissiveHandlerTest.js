/**
 * Tests dismissive warning handler
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
        this.Sut     = this.require( 'warn/DismissiveHandler' );
        this.Warning = this.require( 'warn/Warning' );
    },


    'Can be instantiated without `new` keyword': function()
    {
        this.assertOk( this.Sut() instanceof this.Sut );
    },


    /**
     * Simply do nothing. We don't want to log, we don't want to throw
     * anything, we just want to pretend nothing ever happened and move on
     * our merry way. This is intended for use in production environments
     * where such warnings are expected to already have been worked out and
     * would only confuse/concern the user.
     *
     * Now, testing whether it does anything or not is difficult, since it
     * could do, well, anything; that said, we are not passing it anything
     * via the ctor, so assuming that it does not rely on or manipulate
     * global state, we need only ensure that no exceptions are thrown.
     */
    'Does nothing': function()
    {
        var _self = this;
        this.assertDoesNotThrow( function()
        {
            _self.Sut().handle( _self.Warning( Error( "Ignore me!" ) ) );
        } );
    },
} );

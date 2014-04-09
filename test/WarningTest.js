/**
 * Tests the Warning prototype
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
        this.Sut = this.require( 'warn' ).Warning;
    },


    /**
     * Warning should be a subtype of Error in an effort to ensure
     * consistency and proper handling where Error is expected
     */
    'Warning has Error prototype': function()
    {
        this.assertOk( new this.Sut( Error() ) instanceof Error );
    },


    /**
     * Make clear that we're working with a warning
     */
    'Warning should alter Error name': function()
    {
        this.assertEqual( this.Sut( Error() ).name, 'Warning' );
    },


    /**
     * Just as with the other Error classes, as well as all ease.js classes,
     * the 'new' operator should be optional when instantiating the class
     */
    '`new\' operator is not necessary to instantiate Warning': function()
    {
        this.assertOk( this.Sut( Error( '' ) ) instanceof this.Sut );
    },


    /**
     * Warning message should be taken from the exception passed to it
     */
    'Warning message is set from wrapped exception': function()
    {
        var err = Error( 'oshit' );

        // bug in FF (tested with 8.0) where, without accessing the message
        // property in this test before passing it to Warning, err.message
        // === "" within the Warning ctor. (Assignment is to silence Closure
        // compiler warning.)
        var _ = err.message;

        var warning = this.Sut( err );

        this.assertEqual( warning.message, err.message );

        // this little trick prevents the compiler from optimizing away the
        // assignment, which would break the test in certain versions of FF.
        return _;
    },


    /**
     * The whole point of Warning is to wrap an exception; so, ensure that
     * one is wrapped.
     */
    'Throws exception if no exception is wrapped': function()
    {
        var Sut = this.Sut;

        this.assertThrows( function()
        {
            Sut( /* nothing provided to wrap */ );
        }, TypeError );

        this.assertThrows( function()
        {
            Sut( 'not an exception' );
        }, TypeError );
    },


    /**
     * We must provide access to the wrapped exception so that it can be
     * properly handled; warning is only intended to provide additional
     * information so that ease.js may handle it differently than other
     * Error instances.
     */
    'Can retrieve wrapped exception': function()
    {
        var err     = Error( 'foo' ),
            warning = this.Sut( err );

        this.assertStrictEqual( err, warning.getError() );
    },
} );

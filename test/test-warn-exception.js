/**
 * Tests the Warning prototype
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU Lesser General Public License as published by the Free
 *  Software Foundation, either version 3 of the License, or (at your option)
 *  any later version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 *  for more details.
 *
 *  You should have received a copy of the GNU Lesser General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 * @package test
 */

var common  = require( './common' ),
    assert  = require( 'assert' ),
    Warning = common.require( 'warn' ).Warning
;


/**
 * Warning should be a subtype of Error
 */
( function testWarningIsAvailableAndHasErrorPrototype()
{
    assert.ok( ( Warning( Error() ) instanceof Error ),
        "Warning should be an instance of Error"
    );
} )();


/**
 * Make clear that we're working with a warning
 */
( function testWarningShouldAlterErrorName()
{
    assert.equal( Warning( Error() ).name, 'Warning',
        "Warning name should be properly set"
    );
} )();


/**
 * Just as with the other Error classes, as well as all ease.js classes, the
 * 'new' keyword should be optional when instantiating the class
 */
( function testNewKeywordIsNotRequiredForInstantiation()
{
    assert.ok( Warning( Error( '' ) ) instanceof Warning,
        "'new' keyword should not be necessary to instantiate Warning"
    );
} )();


/**
 * Warning message should be taken from the exception passed to it
 */
( function testCanWarningMessageIsSetFromWrappedException()
{
    var err = Error( 'oshit' );

    // bug in FF (tested with 8.0) where, without accessing the message property
    // in this test before passing it to Warning, err.message === "" within the
    // Warning ctor. (Assignment is to silence Closure compiler warning.)
    var _ = err.message;

    var warning = Warning( err );

    assert.equal( warning.message, err.message,
        "Warning message should be taken from wrapped exception"
    );
} )();


/**
 * The whole point of Warning is to wrap an exception. So, ensure that one is
 * wrapped.
 */
( function testThrowsExceptionIfNoExceptionIsWrapped()
{
    assert['throws']( function()
    {
        Warning( /* nothing provided to wrap */ );
    }, TypeError, "Exception should be thrown if no exception is provided" );

    assert['throws']( function()
    {
        Warning( 'not an exception' );
    }, TypeError, "Exception should be thrown if given value is not an Error" );
} )();


/**
 * We must provide access to the wrapped exception so that it can be properly
 * handled. Warning is only intended to provide additional information so that
 * ease.js may handle it differently than other Error instances.
 */
( function testCanRetrieveWrappedException()
{
    var err     = Error( 'foo' ),
        warning = Warning( err );

    assert.deepEqual( err, warning.getError(),
        "Can retrieve wrapped exception"
    );
} )();


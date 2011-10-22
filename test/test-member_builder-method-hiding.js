/**
 * Tests hidden methods
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
    warn    = common.require( 'warn' )

    // XXX: get rid of this disgusting mess; we're mid-refactor and all these
    // dependencies should not be necessary for testing
    ClassBuilder         = common.require( '/ClassBuilder' ),
    MethodWrapperFactory = common.require( '/MethodWrapperFactory' ),
    wrappers             = common.require( '/MethodWrappers' ).standard,

    builder = ClassBuilder(
        common.require( '/MemberBuilder' )(
            MethodWrapperFactory( wrappers.wrapNew ),
            MethodWrapperFactory( wrappers.wrapOverride )
        ),
        common.require( '/VisibilityObjectFactoryFactory' ).fromEnvironment()
    )
;

// XXX: Disabled until we begin re-development of this feature
return;


/**
 * Restores warning handler to the default
 */
function restoreWarningHandler()
{
    warn.setHandler( warn.handlers.log );
}


/**
 * If a non-virtual method is implicitly hidden (redefined without the 'new'
 * keyword), a warning should be provided. This will ensure that, should a
 * parent introduce a method that is already defined by a subtype, the
 * developer of the subtype is made aware of the issue.
 */
( function testThrowsWarningWhenHidingNonVirtualSuperMethod()
{
    var thrown = false;

    // mock the warning handler to ensure a warning is thrown
    warn.setHandler( function( e )
    {
        thrown = true;

        assert.ok(
            ( e.message.search( 'foo' ) !== -1 ),
            "Non-virtual method hiding warning should contain method name"
        );
    } );

    var Foo = builder.build(
    {
        // non-virtual method
        'public foo': function() {},
    } );

    // implicitly hide the non-virtual method
    builder.build( Foo,
    {
        'public foo': function() {},
    } );

    assert.equal( thrown, true,
        "No warning for implicit non-virtual hiding was thrown"
    );
} )();


/**
 * Same concept as above. The API of the supertype could just as easily be
 * changed to include a virtual method that has already been implemented by the
 * subtype. The default behavior is to hide the method of the supertype.
 */
( function testThrowsWarningWhenHidingVirtualSuperMethod()
{
    var thrown = false;

    // mock the warning handler to ensure a warning is thrown
    warn.setHandler( function( e )
    {
        thrown = true;

        assert.ok(
            ( e.message.search( 'foo' ) !== -1 ),
            "Virtual method hiding warning should contain method name"
        );
    } );

    var Foo = builder.build(
    {
        'virtual public foo': function() {},
    } );

    // implicitly hide the virtual method
    builder.build( Foo,
    {
        'public foo': function() {},
    } );

    assert.equal( thrown, true,
        "No warning for implicit virtual hiding was thrown"
    );
} )();


// important, otherwise tests in combined file may fail
restoreWarningHandler();


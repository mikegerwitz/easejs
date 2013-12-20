/**
 * Tests final members
 *
 *  Copyright (C) 2011 Mike Gerwitz
 *
 *  This file is part of ease.js.
 *
 *  ease.js is free software: you can redistribute it and/or modify it under the
 *  terms of the GNU General Public License as published by the Free Software
 *  Foundation, either version 3 of the License, or (at your option) any later
 *  version.
 *
 *  This program is distributed in the hope that it will be useful, but WITHOUT
 *  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *  FITNESS FOR A PARTICULAR PURPOSE.  See the GNU General Public License for
 *  more details.
 *
 *  You should have received a copy of the GNU General Public License along with
 *  this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @author  Mike Gerwitz
 */

var common  = require( './common' ),
    assert  = require( 'assert' ),
    builder = common.require( 'ClassBuilder' )(
        common.require( 'MemberBuilder' )(),
        common.require( 'VisibilityObjectFactoryFactory' ).fromEnvironment()
    ),

    Class      = common.require( 'class' ),
    FinalClass = common.require( 'class_final' )
;


/**
 * Ensure that FinalClass properly forwards data to create a new Class.
 */
( function testFinalClassesAreValidClasses()
{
    assert.ok( Class.isClass( FinalClass( {} ) ),
        "Final classes should generate valid classes"
    );
} )();


/**
 * When a class is declared as final, it should prevent it from ever being
 * extended. Ever.
 */
( function testFinalClassesCannotBeExtended()
{
    try
    {
        // this should fail
        FinalClass( 'Foo', {} ).extend( {} );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( 'Foo' ) !== -1,
            "Final class error message should contain name of class"
        );

        return;
    }

    assert.fail( "Should not be able to extend final classes" );
} )();


/**
 * Ensure we're able to create final classes by extending existing classes.
 */
( function testCanCreateFinalSubtypes()
{
    var Foo        = builder.build( {} ),
        FinalNamed = FinalClass( 'FinalNamed' ).extend( Foo, {} ),
        FinalAnon  = FinalClass.extend( Foo, {} )
    ;

    // named
    assert['throws']( function()
    {
        FinalNamed.extend( {} );
    }, Error, "Cannot extend final named subtype" );

    // anonymous
    assert['throws']( function()
    {
        FinalAnon.extend( {} );
    }, Error, "Cannot extend final anonymous subtype" );
} )();


/**
 * Tests final members
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
        this.Class      = this.require( 'class' );
        this.FinalClass = this.require( 'class_final' );
    },


    /**
     * Ensure that FinalClass properly forwards data to create a new Class.
     */
    'Final classes are valid classes': function()
    {
        this.assertOk( this.Class.isClass( this.FinalClass( {} ) ),
            "Final classes should generate valid classes"
        );
    },


    /**
     * When a class is declared as final, it should prevent it from ever
     * being extended. Ever.
     */
    'Final classes cannot be extended': function()
    {
        try
        {
            // this should fail
            this.FinalClass( 'Foo', {} ).extend( {} );
        }
        catch ( e )
        {
            this.assertOk(
                e.message.search( 'Foo' ) !== -1,
                "Final class error message should contain name of class"
            );

            return;
        }

        this.assertFail( "Should not be able to extend final classes" );
    },


    /**
     * Ensure we're able to create final classes by extending existing
     * classes.
     */
    'Can create final subtypes': function()
    {
        // XXX: clean up this mess.
        var builder = this.require( 'ClassBuilder' )(
            this.require( 'warn' ).DismissiveHandler(),
            this.require( 'MemberBuilder' )(),
            this.require( 'VisibilityObjectFactoryFactory' )
                .fromEnvironment()
        );

        var Foo        = builder.build( {} ),
            FinalNamed = this.FinalClass( 'FinalNamed' ).extend( Foo, {} ),
            FinalAnon  = this.FinalClass.extend( Foo, {} )
        ;

        // named (TODO: check error message)
        this.assertThrows( function()
        {
            FinalNamed.extend( {} );
        }, Error, "Cannot extend final named subtype" );

        // anonymous (TODO: check error message)
        this.assertThrows( function()
        {
            FinalAnon.extend( {} );
        }, Error, "Cannot extend final anonymous subtype" );
    },
} );

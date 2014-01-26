/**
 * Tests basic trait definition
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
        this.Sut           = this.require( 'Trait' );
        this.Class         = this.require( 'class' );
        this.AbstractClass = this.require( 'class_abstract' );
    },


    /**
     * If a trait contains an abstract member, then any class that uses it
     * should too be considered abstract if no concrete implementation is
     * provided.
     */
    'Abstract traits create abstract classes when used': function()
    {
        var T = this.Sut( { 'abstract foo': [] } );

        var _self = this;
        this.assertDoesNotThrow( function()
        {
            // no concrete `foo; should be abstract (this test is sufficient
            // because AbstractClass will throw an error if there are no
            // abstract members)
            _self.AbstractClass.use( T ).extend( {} );
        }, Error );
    },


    /**
     * A class may still be concrete even if it uses abstract traits so long
     * as it provides concrete implementations for each of the trait's
     * abstract members.
     */
    'Concrete classes may use abstract traits by definining members':
    function()
    {
        var T      = this.Sut( { 'abstract traitfoo': [ 'foo' ] } ),
            C      = null,
            called = false;

        var _self = this;
        this.assertDoesNotThrow( function()
        {
            C = _self.Class.use( T ).extend(
            {
                traitfoo: function( foo ) { called = true; },
            } );
        } );

        // sanity check
        C().traitfoo();
        this.assertOk( called );
    },


    /**
     * The concrete methods provided by a class must be compatible with the
     * abstract definitions of any used traits. This test ensures not only
     * that the check is being performed, but that the abstract declaration
     * is properly inherited from the trait.
     *
     * TODO: The error mentions "supertype" compatibility, which (although
     * true) may be confusing; perhaps reference the trait that declared the
     * method as abstract.
     */
    'Concrete classes must be compatible with abstract traits': function()
    {
        var T      = this.Sut( { 'abstract traitfoo': [ 'foo' ] } );

        var _self = this;
        this.assertThrows( function()
        {
            C = _self.Class.use( T ).extend(
            {
                // missing param in definition
                traitfoo: function() { called = true; },
            } );
        } );
    },
} );

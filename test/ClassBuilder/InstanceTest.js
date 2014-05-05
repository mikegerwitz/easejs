/**
 * Tests treatment of class instances
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
        this.Sut = this.require( 'ClassBuilder' );
    },


    /**
     * Instance check delegation helps to keep ease.js extensible and more
     * loosely coupled. If the given type implements a method
     * __isInstanceOf, it will be invoked and its return value will be the
     * result of the entire expression.
     */
    'Delegates to type-specific instance method if present': function()
    {
        var _self = this;

        // object to assert against
        var obj    = {},
            called = false;

        // mock type
        var type = { __isInstanceOf: function( givent, giveno )
        {
            _self.assertStrictEqual( givent, type );
            _self.assertStrictEqual( giveno, obj );

            called = true;
            return true;
        } };

        this.assertOk( this.Sut.isInstanceOf( type, obj ) );
        this.assertOk( called );
    },


    /**
     * In the event that the provided type does not provide any instance
     * check method, we shall fall back to ECMAScript's built-in instanceof
     * operator.
     */
    'Falls back to ECMAScript instanceof check lacking type method':
    function()
    {
        // T does not define __isInstanceOf
        var T = function() {},
            o = new T();

        this.assertOk( this.Sut.isInstanceOf( T, o ) );
        this.assertOk( !( this.Sut.isInstanceOf( T, {} ) ) );
    },


    /**
     * The instanceof operator will throw an exception if the second operand
     * is not a function. Our fallback shall not do that---it shall simply
     * return false.
     */
    'Fallback does not throw exception if type is not a constructor':
    function()
    {
        var _self = this;
        this.assertDoesNotThrow( function()
        {
            // type is not a ctor; should just return false
            _self.assertOk( !( _self.Sut.isInstanceOf( {}, {} ) ) );
        } );
    },
} );


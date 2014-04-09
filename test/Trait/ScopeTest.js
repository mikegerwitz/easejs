/**
 * Tests trait scoping
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
        this.Sut   = this.require( 'Trait' );
        this.Class = this.require( 'class' );
    },


    /**
     * Since the private scope of classes and the traits that they use are
     * disjoint, traits should never be able to access any private member of
     * a class that uses it.
     *
     * The beauty of this is that we get this ``feature'' for free with
     * our composition-based trait implementation.
     */
    'Private class members are not accessible to used traits': function()
    {
        var T = this.Sut(
        {
            // attempts to access C._priv
            'public getPriv': function() { return this._priv; },

            // attempts to invoke C._privMethod
            'public invokePriv': function() { this._privMethod(); },
        } );

        var inst = this.Class.use( T ).extend(
        {
            'private _priv': 'foo',
            'private _privMethod': function() {},
        } )();

        this.assertEqual( inst.getPriv(), undefined );
        this.assertThrows( function()
        {
            inst.invokePriv();
        }, Error );
    },


    /**
     * Similar concept to the above---class and trait scopes are disjoint.
     * This is particularily important, since traits will have no idea what
     * other traits they will be mixed in with and therefore must be immune
     * from nasty state clashes.
     */
    'Private trait members are not accessible to containing class':
    function()
    {
        var T = this.Sut(
        {
            'private _priv': 'bar',
            'private _privMethod': function() {},
        } );

        // reverse of the previous test case
        var inst = this.Class.use( T ).extend(
        {
            // attempts to access T._priv
            'public getPriv': function() { return this._priv; },

            // attempts to invoke T._privMethod
            'public invokePriv': function() { this._privMethod(); },
        } )();


        this.assertEqual( inst.getPriv(), undefined );
        this.assertThrows( function()
        {
            inst.invokePriv();
        }, Error );
    },


    /**
     * Since all scopes are disjoint, it would stand to reason that all
     * traits should also have their own private scope independent of other
     * traits that are mixed into the same class. This is also very
     * important for the same reasons as the previous test---we cannot have
     * state clashes between traits.
     */
    'Traits do not have access to each others\' private members': function()
    {
        var T1 = this.Sut(
            {
                'private _priv1': 'foo',
                'private _privMethod1': function() {},
            } ),
            T2 = this.Sut(
            {
                // attempts to access T1._priv1
                'public getPriv': function() { return this._priv1; },

                // attempts to invoke T1._privMethod1
                'public invokePriv': function() { this._privMethod1(); },
            } );

        var inst = this.Class.use( T1, T2 ).extend( {} )();

        this.assertEqual( inst.getPriv(), undefined );
        this.assertThrows( function()
        {
            inst.invokePriv();
        }, Error );
    },


    /**
     * If this seems odd at first, consider this: traits provide
     * copy/paste-style functionality, meaning they need to be able to
     * provide public methods. However, we may not always want to mix trait
     * features into a public API; therefore, we need the ability to mix in
     * protected members.
     */
    'Classes can access protected trait members': function()
    {
        var T = this.Sut( { 'protected foo': function() {} } );

        var _self = this;
        this.assertDoesNotThrow( function()
        {
            _self.Class.use( T ).extend(
            {
                // invokes protected trait method
                'public callFoo': function() { this.foo(); }
            } )().callFoo();
        } );
    },
} );

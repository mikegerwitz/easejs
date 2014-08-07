/**
 * Tests interface interoperability with vanilla ECMAScript
 *
 *  Copyright (C) 2014 Free Software Foundation, Inc.
 *
 *  This file is part of GNU ease.js.
 *
 *  GNU ease.js is free software: you can redistribute it and/or modify
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
        this.Sut   = this.require( 'interface' );
        this.Class = this.require( 'class' );

        this.I = this.Sut(
        {
            foo: [ 'a', 'b' ],
            bar: [ 'a' ],
        } );

        this.assertICompat = function( I, inst )
        {
            this.assertOk( I.isCompatible( inst ) );
            this.assertOk( this.Sut.isInstanceOf( I, inst ) );
        };

        this.assertNotICompat = function( I, inst )
        {
            this.assertOk( !I.isCompatible( inst ) );
            this.assertOk( !this.Sut.isInstanceOf( I, inst ) );
        };
    },


    /**
     * Not all developers will wish to use ease.js, even if the library they
     * are interfacing with does. In the case of interfaces, this isn't
     * particularity important. To understand why, consider the three main
     * reasons why interfaces would be used: (1) to ensure that an object
     * conforms to a defined API; (2) to permit polymorphism; and (3) to
     * denote intent of use, meaning that even though a Basketball and Gun
     * may both implement a `shoot' method, they are not intended to be used
     * in the same context, even if both of them can be `shot'.
     *
     * Prototypes in JavaScript, without aid of a static analysis tool,
     * generally rely on duck typing to enforce interfaces. In this sense,
     * (3) can be sacrificed for the sake of interop but it's still
     * important when working with ease.js classes). Since (2) follows as a
     * consequence of (1), we need only a way to ensure that the API of the
     * prototype is compatible with the named interface. In ease.js, this is
     * is quick: the implemented interfaces are cached. With prototypes,
     * even though it's not as efficient, we can still check that each of
     * the methods named in the interface exist and are compatible (have the
     * proper number of arguments).
     *
     * This has two powerful consequences: (1) external code can interface
     * with ease.js without having to buy into its class/interface system;
     * and (2) interfaces can be created to represent existing
     * objects/prototypes (e.g. W3C DOM APIs).
     */
    'Prototype instances and objects can conform to interfaces': function()
    {
        // conforming prototype
        function P() {};
        P.prototype = {
            foo: function( a, b ) {},
            bar: function( a ) {},
        };

        var p = new P();

        // instance should therefore be conforming
        this.assertICompat( this.I, p );

        // ah but why stop there? (note that this implies that *any* object,
        // prototype or not, can conform to an interface)
        this.assertICompat( this.I, P.prototype );
    },


    /**
     * The entire point of interfaces is to ensure that a specific API is in
     * place; methods are the core component of this.
     */
    'Objects missing methods are non-conforming': function()
    {
        // missing method
        function P() {};
        P.prototype = {
            foo: function( a, b ) {},
        };

        this.assertNotICompat( this.I, new P() );
        this.assertNotICompat( this.I, P.prototype );
    },


    /**
     * ease.js enforces parameter count so that implementers are cognisant
     * of the requirements of the API. We have two cases to consider here:
     * (1) that an external prototype is attempting to conform to an ease.js
     * interface; or (2) that an interface is being developed for an
     * existing external prototype. In the former case, the user has control
     * over the parameter list. In the latter case, the interface designer
     * can design an interface that requires only the most common subset of
     * parameters, or none at all.
     */
    'Methods missing parameters are non-conforming': function()
    {
        // missing second param (at this point, we know prototype traversal
        // works, so we will just use any 'ol object)
        var obj = { foo: function( a ) {} },
            I   = this.Sut( { foo: [ 'a', 'b' ] } );

        this.assertNotICompat( I, obj );
    },


    /**
     * This test is consistent with ease.js' functionality.
     */
    'Methods are still compatible with extra parameters': function()
    {
        // extra param is okay
        var obj = { foo: function( a, b, c ) {} },
            I   = this.Sut( { foo: [ 'a', 'b' ] } );

        this.assertICompat( I, obj );
    },


    /**
     * This should go without explanation.
     */
    'Interface methods must be implemented as functions': function()
    {
        // not a function
        var obj = { foo: {} },
            I   = this.Sut( { foo: [] } );

        this.assertNotICompat( I, obj );
    },


    /**
     * Interfaces define only an API that must exist; it does not restrict a
     * more rich API.
     */
    'Additional methods do not trigger incompatibility': function()
    {
        // extra methods are okay
        var obj = { foo: function() {}, bar: function() {} },
            I   = this.Sut( { foo: [] } );

        this.assertICompat( I, obj );
    },


    /**
     * When an object is instantiated from an ease.js class, it does not
     * matter if the interface is compatible: in order to be considered an
     * instance some interface I, the instance's type must implement I; in
     * this sense, ease.js' interface typing is strict, allowing *intent* to
     * be conveyed.
     *
     * An example of why this is important can be found in the
     * interoperability section of the manual.
     */
    'Objects can be compatible but not instances of interface': function()
    {
        // same API, different interface objects
        var Ia = this.Sut( { foo: [] } ),
            Ib = this.Sut( { foo: [] } );

        var dfn = { foo: function() {} },
            Ca  = this.Class.implement( Ia ).extend( dfn ),
            Cb  = this.Class.implement( Ib ).extend( dfn );

        var ia = Ca(),
            ib = Cb();

        // clearly the two are compatible, regardless of their type
        this.assertOk( Ia.isCompatible( ia ) );
        this.assertOk( Ia.isCompatible( ib ) );
        this.assertOk( Ib.isCompatible( ia ) );
        this.assertOk( Ib.isCompatible( ib ) );

        // but ia is *not* an instance of Ib, nor ib of Ia
        this.assertOk( this.Sut.isInstanceOf( Ia, ia ) );
        this.assertOk( !this.Sut.isInstanceOf( Ia, ib ) );
        this.assertOk( this.Sut.isInstanceOf( Ib, ib ) );
        this.assertOk( !this.Sut.isInstanceOf( Ib, ia ) );
    },
} );


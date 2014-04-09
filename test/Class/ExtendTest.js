/**
 * Tests class module extend() method
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
 *
 * Note that these tests all use the `new' keyword for instantiating
 * classes, even though it is not required with ease.js; this is both for
 * historical reasons (when `new' was required during early development) and
 * because we are not testing (and do want to depend upon) that feature.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.test_props = {
            one: 1,
            two: 2,
        };

        this.Sut = this.require( 'class' );

        // there are two different means of extending; we want to test them
        // both (this will be denoted Foo)
        this.classes = [
            this.Sut.extend( this.test_props ),
            this.Sut( this.test_props ),
        ];
    },


    /**
     * All classes can be easily extended via an extend method, although it
     * is not necessarily recommended to be used directly, as you must
     * ensure that the object is an ease.js class and the resulting class
     * will be anonymous.
     */
    '@each(classes) Created class contains extend method': function( C )
    {
        this.assertOk( typeof C.extend === 'function' );
    },


    /**
     * It would make sense that a subtype returned is an object, since it
     * cannot be a class if it isn't.
     */
    '@each(classes) Subtype is returned as an object': function( C )
    {
        this.assertOk( C.extend() instanceof Object );
    },


    /**
     * Subtypes should inherit all properties of the supertype into their
     * prototype chain.
     */
    '@each(classes) Subtype inherits parent properties': function( C )
    {
        var SubFoo = C.extend();

        for ( var prop in this.test_props )
        {
            this.assertEqual(
                this.test_props[ prop ],
                SubFoo.prototype[ prop ],
                "Missing property: " + prop
            );
        }
    },


    /**
     * A subtype should obvious contain the properties that were a part of
     * its definition.
     */
    '@each(classes) Subtype contains its own properties': function( C )
    {
        var sub_props = {
            three: 3,
            four:  4,
        };

        var sub_foo = new C.extend( sub_props )();

        // and ensure that the subtype's properties were included
        for ( var prop in sub_props )
        {
            this.assertEqual(
                sub_props[ prop ],
                sub_foo[ prop ],
                "Missing property: " + prop
            );
        }
    },


    /**
     * In addition to the core functions provided by ease.js for checking
     * instances, we try to ease into the protype model the best we can in
     * order to work with other prototypes; therefore, instances should be
     * recognized as instances of their parent classes even by the
     * ECMAScript `instanceof' operator.
     */
    '@each(classes) Subtypes are ECMAScript instances of their supertypes':
    function( C )
    {
        this.assertOk( C.extend()() instanceof C );
    },


    /**
     * Even though this can be checked using the instanceof operator,
     * ease.js has a more complex type system (e.g. supporting of
     * interfaces) and so we want to provide a consistent alternative.
     */
    '@each(classes) Subtypes are easejs instances of their supertypes':
    function( C )
    {
        var SubFoo       = C.extend(),
            sub_instance = new SubFoo();

        this.assertOk( sub_instance.isInstanceOf( SubFoo ) );
    },


    /*
     *         Foo
     *          |
     *        SubFoo
     *        /   \
     * SubSubFoo  SubSubFoo2
     *
     /

    /**
     * Objects should be considered instances of any classes that their
     * instantiating class inherits from, since they inherit their API and
     * are interchangable, provided that only the common subset of the API
     * is used.
     */
    '@each(classes) Objects are instances of their super-supertypes':
    function( C )
    {
        var sub_sub_instance = new ( C.extend().extend() )();

        this.assertOk(
            ( ( sub_sub_instance instanceof C )
                && sub_sub_instance.isInstanceOf( C )
            )
        );
    },


    /**
     * It would not make sense that an object is considered to be an
     * instance of any possible subtypes---that is, if C inherits B, then an
     * instance of B is not of type C; C could introduce an incompatible
     * interface.
     */
    '@each(classes) Objects are not instances of subtypes': function( C )
    {
        var SubFoo    = C.extend(),
            SubSubFoo = SubFoo.extend(),
            sub_inst  = new SubFoo();

        this.assertOk(
            ( !( sub_inst instanceof SubSubFoo )
                && !( sub_inst.isInstanceOf( SubSubFoo ) )
            )
        );
    },


    /**
     * Two classes that inherit from a common parent are not compatible, as
     * they can introduce their own distinct interfaces.
     */
    '@each(classes) Objects are not instances of sibling types':
    function( C )
    {
        var SubFoo     = C.extend(),
            SubSubFoo  = SubFoo.extend(),
            SubSubFoo2 = SubFoo.extend(),

            sub_sub2_inst = new SubSubFoo2();

        this.assertOk(
            ( !( sub_sub2_inst instanceof SubSubFoo )
                && !( sub_sub2_inst.isInstanceOf( SubSubFoo ) )
            )
        );
    },


    /**
     * We support extending existing prototypes (that is, inherit from
     * constructors that were not created using ease.js).
     */
    'Constructor prototype is copied to subclass': function()
    {
        var Ctor = function() {};
        Ctor.prototype = { foo: {} };

        this.assertStrictEqual(
            this.Sut.extend( Ctor, {} ).prototype.foo,
            Ctor.prototype.foo
        );
    },


    /**
     * This should go without saying---we're aiming for consistency here and
     * subclassing doesn't make much sense if it doesn't work.
     */
    'Subtype of constructor should contain extended members': function()
    {
        var Ctor = function() {};

        this.assertNotEqual(
            ( new this.Sut.extend( Ctor, { foo: {} } )() ).foo,
            undefined
        );
    },


    /**
     * If a subtype provides a property of the same name as its parent, then
     * it should act as a reassignment.
     */
    'Subtypes can override parent property values': function()
    {
        var expect = 'ok',
            C    = this.Sut.extend( { p: null } ).extend( { p: expect } );

        this.assertEqual( C().p, expect );
    },


    /**
     * Prevent overriding the internal method that initializes property
     * values upon instantiation.
     */
    '__initProps() cannot be declared (internal method)': function()
    {
        var _self = this;

        this.assertThrows( function()
        {
            _self.Sut.extend(
            {
                __initProps: function() {},
            } );
        }, Error );
    },


    // TODO: move me into a more appropriate test case (this may actually be
    // tested elsewhere)
    /**
     * If using the short-hand extend, an object is required to represent
     * the class defintiion.
     */
    'Invoking class module requires object as argument if extending':
    function()
    {
        var _self = this;

        // these tests can be run in the browser in pre-ES5 environments, so
        // no forEach()
        var chk = [ 5, false, undefined ],
            i   = chk.length;

        while ( i-- )
        {
            this.assertThrows( function()
                {
                    _self.Sut( chk[ i ] );
                },
                TypeError
            );
        }
    },


    /**
     * We provide a useful default toString() method, but one may wish to
     * override it
     */
    'Can override toString() method': function()
    {
        var str    = 'foomookittypoo',
            result = ''
        ;

        result = this.Sut( 'FooToStr',
        {
            toString: function()
            {
                return str;
            },
        } )().toString();

        this.assertEqual( result, str );
    },


    /**
     * In ease.js's initial design, keywords were not included. This meant
     * that duplicate member definitions were not possible---it'd throw a
     * parse error (maybe). However, with keywords, it is now possible to
     * redeclare a member with the same name in the same class definition.
     * Since this doesn't make much sense, we must disallow it.
     */
    'Cannot provide duplicate member definitions using unique keys':
    function()
    {
        var _self = this;

        this.assertThrows( function()
        {
            _self.Sut(
            {
                // declare as protected first so that we won't get a visibility
                // de-escalation error with the below re-definition
                'protected foo': '',

                // should fail; redefinition
                'public foo': '',
            } );
        }, Error );

        this.assertThrows( function()
        {
            _self.Sut(
            {
                // declare as protected first so that we won't get a visibility
                // de-escalation error with the below re-definition
                'protected foo': function() {},

                // should fail; redefinition
                'public foo': function() {},
            } );
        }, Error );
    },


    /**
     * To understand this test, one must understand how "inheritance" works
     * with prototypes. We must create a new instance of the ctor (class)
     * and add that instance to the prototype chain (if we added an
     * un-instantiated constructor, then the members in the prototype would
     * be accessible only though ctor.prototype). Therefore, when we
     * instantiate this class for use in the prototype, we must ensure the
     * constructor is not invoked, since our intent is not to create a new
     * instance of the class.
     */
    '__construct should not be called when extending class': function()
    {
        var called = false,
            Foo    = this.Sut( {
                'public __construct': function()
                {
                    called = true;
                }
            } ).extend( {} );

        this.assertEqual( called, false );
    },


    /**
     * Previously, when attempting to extend from an invalid supertype,
     * you'd get a CALL_NON_FUNCTION_AS_CONSTRUCTOR error, which is not very
     * helpful to someone who is not familiar with the ease.js internals.
     * Let's provide a more useful error that clearly states what's going
     * on.
     */
    'Extending from non-ctor or non-class provides useful error': function()
    {
        try
        {
            // invalid supertype
            this.Sut.extend( 'oops', {} );
        }
        catch ( e )
        {
            this.assertOk( e.message.search( 'extend from' ),
                "Error message for extending from non-ctor or class " +
                "makes sense"
            );

            return;
        }

        this.assertFail(
            "Attempting to extend from non-ctor or class should " +
            "throw exception"
        );
    },


    /**
     * If we attempt to extend an object (rather than a constructor), we
     * should simply use that as the prototype directly rather than
     * attempting to instantiate it.
     */
    'Extending object will not attempt instantiation': function()
    {
        var obj = { foo: 'bar' };

        this.assertEqual( obj.foo, this.Sut.extend( obj, {} )().foo,
            "Should be able to use object as prototype"
        );
    },


    /**
     * Gathering metadata on public methods of supertypes N>1 distance away
     * is easy, as it is part of the public prototype chain that is
     * naturally traversed by JavaScript. However, we must ensure that we
     * properly recurse on *all* visibility objects.
     *
     * This test addresses a pretty alarming bug that was not caught during
     * initial development---indeed, until the trait implementation, which
     * exploits the class system in some odd ways---because the author
     * dislikes inheritence in general, letalone large hierarchies, so
     * protected members of super-supertypes seems to have gone untested.
     */
    'Extending validates against non-public super-supertype methods':
    function()
    {
        var called = false;

        this.Sut.extend(
        {
            'virtual protected foo': function()
            {
                called = true;
            }
        } ).extend(
        {
            // intermediate to disconnect subtype
        } ).extend(
        {
            'override public foo': function()
            {
                this.__super();
            }
        } )().foo();

        // the override would have only actually taken place if the
        // protected foo was recognized
        this.assertOk( called );
    },
} );

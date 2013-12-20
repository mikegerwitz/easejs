/**
 * Tests class module extend() method
 *
 *  Copyright (C) 2010, 2011 Mike Gerwitz
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

var common = require( './common' ),
    assert = require( 'assert' ),
    Class  = common.require( 'class' );

var foo_props = {
        one: 1,
        two: 2,
    },

    // there are two different means of extending; we want to test them both
    classes = [
        Class.extend( foo_props ),
        Class( foo_props ),
    ],

    class_count = classes.length,

    // will hold the class being tested
    Foo = null
;


// Run all tests for both. This will ensure that, regardless of how the class is
// created, it operates as it should. Fortunately, these tests are fairly quick.
for ( var i = 0; i < class_count; i++ )
{
    Foo = classes[ i ];

    assert.ok(
        ( Foo.extend instanceof Function ),
        "Created class contains extend method"
    );

    var sub_props = {
            three: 3,
            four:  4,
        },

        SubFoo  = Foo.extend( sub_props ),
        sub_foo = SubFoo()
    ;

    assert.ok(
        ( SubFoo instanceof Object ),
        "Subtype is returned as an object"
    );

    // ensure properties were inherited from supertype
    for ( var prop in foo_props )
    {
        assert.equal(
            foo_props[ prop ],
            SubFoo.prototype[ prop ],
            "Subtype inherits parent properties: " + prop
        );
    }

    // and ensure that the subtype's properties were included
    for ( var prop in sub_props )
    {
        assert.equal(
            sub_props[ prop ],
            sub_foo[ prop ],
            "Subtype contains its own properties: " + prop
        );
    }


    var sub_instance = new SubFoo();

    assert.ok(
        ( sub_instance instanceof Foo ),
        "Subtypes are considered to be instances of their supertypes " +
            "(via instanceof operator)"
    );

    assert.ok(
        sub_instance.isInstanceOf( SubFoo ),
        "Subtypes are considered to be instances of their supertypes (via " +
            "isInstanceOf method)"
    );


    //         Foo
    //          |
    //        SubFoo
    //        /   \
    // SubSubFoo  SubSubFoo2
    //
    var SubSubFoo  = SubFoo.extend(),
        SubSubFoo2 = SubFoo.extend(),

        sub_sub_instance  = new SubSubFoo(),
        sub_sub2_instance = new SubSubFoo2();

    assert.ok(
        ( ( sub_sub_instance instanceof Foo )
            && sub_sub_instance.isInstanceOf( Foo )
        ),
        "Sub-subtypes should be instances of their super-supertype"
    );

    assert.ok(
        ( !( sub_instance instanceof SubSubFoo )
            && !( sub_instance.isInstanceOf( SubSubFoo ) )
        ),
        "Supertypes should not be considered instances of their subtypes"
    );

    assert.ok(
        ( !( sub_sub2_instance instanceof SubSubFoo )
            && !( sub_sub2_instance.isInstanceOf( SubSubFoo ) )
        ),
        "Subtypes should not be considered instances of their siblings"
    );


    // to test inheritance of classes that were not previously created via the
    // Class.extend() method
    var OtherClass = function() {};
    OtherClass.prototype =
    {
        foo: 'bla',
    };

    var SubOther = Class.extend( OtherClass,
    {
        newFoo: 2,
    });


    assert.equal(
        SubOther.prototype.foo,
        OtherClass.prototype.foo,
        "Prototype of existing class should be copied to subclass"
    );

    assert.notEqual(
        SubOther().newFoo,
        undefined,
        "Subtype should contain extended members"
    );


    assert['throws']( function()
    {
        Class.extend( OtherClass,
        {
            foo: function() {},
        });
    }, TypeError, "Cannot override property with a method" );


    var AnotherFoo = Class.extend(
    {
        arr: [],
        obj: {},
    });

    var Obj1 = new AnotherFoo(),
        Obj2 = new AnotherFoo();

    Obj1.arr.push( 'one' );
    Obj2.arr.push( 'two' );

    Obj1.obj.a = true;
    Obj2.obj.b = true;

    // to ensure we're not getting/setting values of the prototype (=== can also be
    // used to test for references, but this test demonstrates the functionality
    // that we're looking to ensure)
    assert.ok(
        ( ( Obj1.arr[ 0 ] === 'one' ) && ( Obj2.arr[ 0 ] === 'two' ) ),
        "Multiple instances of the same class do not share array references"
    );

    assert.ok(
        ( ( ( Obj1.obj.a === true ) && ( Obj1.obj.b === undefined ) )
            && ( ( Obj2.obj.a === undefined ) && ( Obj2.obj.b === true ) )
        ),
        "Multiple instances of the same class do not share object references"
    );

    var arr_val = 1;
    var SubAnotherFoo = AnotherFoo.extend(
    {
        arr: [ arr_val ],
    });

    var SubObj1 = new SubAnotherFoo(),
        SubObj2 = new SubAnotherFoo();

    assert.ok(
        ( ( SubObj1.arr !== SubObj2.arr ) && ( SubObj1.obj !== SubObj2.obj ) ),
        "Instances of subtypes do not share property references"
    );

    assert.ok(
        ( ( SubObj1.arr[ 0 ] === arr_val ) && ( SubObj2.arr[ 0 ] === arr_val ) ),
        "Subtypes can override parent property values"
    );

    assert['throws']( function()
    {
        Class.extend(
        {
            __initProps: function() {},
        });
    }, Error, "__initProps() cannot be declared (internal method)" );


    var SubSubAnotherFoo = AnotherFoo.extend(),
        SubSubObj1       = new SubSubAnotherFoo(),
        SubSubObj2       = new SubSubAnotherFoo();

    // to ensure the effect is recursive
    assert.ok(
        ( ( SubSubObj1.arr !== SubSubObj2.arr )
            && ( SubSubObj1.obj !== SubSubObj2.obj )
        ),
        "Instances of subtypes do not share property references"
    );
}


( function testInvokingClassModuleRequiresObjectAsArgumentIfCreating()
{
    assert['throws']( function()
        {
            Class( 'moo' );
            Class( 5 );
            Class( false );
            Class();
        },
        TypeError,
        "Invoking class module requires object as argument if extending " +
            "from base class"
    );

    var args = [ {}, 'one', 'two', 'three' ];

    // we must only provide one argument if the first argument is an object (the
    // class definition)
    try
    {
        Class.apply( null, args );

        // if all goes well, we don't get to this line
        assert.fail(
            "Only one argument for class definitions is permitted"
        );
    }
    catch ( e )
    {
        assert.notEqual(
            e.message.match( args.length + ' given' ),
            null,
            "Class invocation should give argument count on error"
        );
    }
} )();


/**
 * We provide a useful default toString() method, but one may wish to override
 * it
 */
( function testCanOverrideToStringMethod()
{
    var str    = 'foomookittypoo',
        result = ''
    ;

    result = Class( 'FooToStr',
    {
        toString: function()
        {
            return str;
        },
        bla: function() {},
    })().toString();

    assert.equal(
        result,
        str,
        "Can override default toString() method of class"
    );
} )();


/**
 * In ease.js's initial design, keywords were not included. This meant that
 * duplicate member definitions were not possible - it'd throw a parse error.
 * However, with keywords, it is now possible to redeclare a member with the
 * same name in the same class definition. Since this doesn't make much sense,
 * we must disallow it.
 */
( function testCannotProvideDuplicateMemberDefintions()
{
    assert['throws']( function()
    {
        Class(
        {
            // declare as protected first so that we won't get a visibility
            // de-escalation error with the below re-definition
            'protected foo': '',

            // should fail; redefinition
            'public foo': '',
        } );
    }, Error, "Cannot redeclare property in same class definition" );

    assert['throws']( function()
    {
        Class(
        {
            // declare as protected first so that we won't get a visibility
            // de-escalation error with the below re-definition
            'protected foo': function() {},

            // should fail; redefinition
            'public foo': function() {},
        } );
    }, Error, "Cannot redeclare method in same class definition" );
} )();


/**
 * To understand this test, one must understand how "inheritance" works
 * with prototypes. We must create a new instance of the ctor (class) and add
 * that instance to the prototype chain (if we added an un-instantiated
 * constructor, then the members in the prototype would be accessible only
 * though ctor.prototype). Therefore, when we instantiate this class for use in
 * the prototype, we must ensure the constructor is not invoked, since our
 * intent is not to create a new instance of the class.
 */
( function testConstructorShouldNotBeCalledWhenExtendingClass()
{
    var called = false,
        Foo    = Class( {
            'public __construct': function()
            {
                called = true;
            }
        } ).extend( {} );

    assert.equal( called, false,
        "Constructor should not be called when extending a class"
    );
} )();


/**
 * Previously, when attempting to extend from an invalid supertype, you'd get a
 * CALL_NON_FUNCTION_AS_CONSTRUCTOR error, which is not very helpful to someone
 * who is not familiar with the ease.js internals. Let's provide a more useful
 * error that clearly states what's going on.
 */
( function testExtendingFromNonCtorOrClassProvidesUsefulError()
{
    try
    {
        // invalid supertype
        Class.extend( 'oops', {} );
    }
    catch ( e )
    {
        assert.ok( e.message.search( 'extend from' ),
            "Error message for extending from non-ctor or class makes sense"
        );

        return;
    }

    assert.fail(
        "Attempting to extend from non-ctor or class should throw exception"
    );
} )();


/**
 * Only virtual methods may be overridden.
 */
( function testCannotOverrideNonVirtualMethod()
{
    try
    {
        var Foo = Class(
            {
                // non-virtual
                'public foo': function() {},
            } ),

            SubFoo = Foo.extend(
            {
                // should fail (cannot override non-virtual method)
                'override public foo': function() {},
            } );
    }
    catch ( e )
    {
        assert.ok( e.message.search( 'foo' ),
            "Non-virtual override error message should contain name of method"
        );

        return;
    }

    assert.fail( "Should not be permitted to override non-virtual method" );
} )();


/**
 * If we attempt to extend an object (rather than a constructor), we should
 * simply use that as the prototype directly rather than attempting to
 * instantiate it.
 */
( function testExtendingObjectWillNotAttemptInstantiation()
{
    var obj = { foo: 'bar' };

    assert.equal( obj.foo, Class.extend( obj, {} )().foo,
        'Should be able to use object as prototype'
    );
} )();


/**
 * It only makes sense to extend from an object or function (constructor, more
 * specifically)
 *
 * We could also test to ensure that the return value of the constructor is an
 * object, but that is unnecessary for the time being.
 */
( function testWillThrowExceptionIfNonObjectOrCtorIsProvided()
{
    assert['throws']( function()
    {
        Class.extend( 'foo', {} );
    }, TypeError, 'Should not be able to extend from non-object or non-ctor' );
} )();


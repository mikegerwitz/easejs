/**
 * Tests class module extend() method
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

    class_count = classes.length

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


    assert.throws( function()
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

    assert.throws( function()
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
    assert.throws( function()
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
            e.toString().match( args.length + ' given' ),
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

    result = Class( 'Foo',
    {
        toString: function()
        {
            return str;
        }
    })().toString();

    assert.equal(
        result,
        str,
        "Can override default toString() method of class"
    );
} )();


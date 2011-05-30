/**
 * Tests const keyword
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
    builder = common.require( 'class_builder' )
;


/**
 * The `const' keyword does not make sense with methods, as they are always
 * immutable. Methods of a class cannot be redefined after the class definition.
 * They may only be overridden by subtypes.
 */
( function testConstKeywordCannotBeUsedWithMethods()
{
    try
    {
        // attempt to create a constant method (should fail)
        builder.build(
        {
            'const foo': function() {},
        } );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( 'foo' ) !== -1,
            "Const method error message should contain name of method"
        );

        return;
    }

    assert.fail( "Should not be able to declare constant methods" );
} )();


/**
 * The const keyword implies static. Using static along with it is redundant and
 * messy. Disallow it.
 */
( function testConstKeywordCannotBeUsedWithStatic()
{
    try
    {
        // should fail
        builder.build(
        {
            'static const foo': 'val',
        } );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( 'foo' ) !== -1,
            "Static const method error message should contain name of property"
        );

        return;
    }

    assert.fail( "Should not be able to use static keyword with const" );
} )();


/**
 * The const keyword should result in a static property. The rationale for this
 * is that, if a value is constant, then instances do not make sense.
 */
( function testConstKeywordDeclaresPropertiesAsStatic()
{
    var val = 'baz',
        Foo = builder.build(
        {
            'const foo': val,
        } )
    ;

    assert.equal( val, Foo.$('foo'),
        "Const keyword should declare properties as static"
    );
} )();


/**
 * As the name implies, constant properties should not be writable.
 */
( function testConstKeywordCreatesImmutableProperty()
{
    try
    {
        // this should fail (trying to alter const prop foo)
        builder.build( { 'const foo': 'bar'  } ).$( 'foo', 'baz' );
    }
    catch ( e )
    {
        assert.ok(
            e.message.search( 'foo' ) !== -1,
            "Const modification error should contain name of property"
        );

        return;
    }

    assert.fail( "Constant properties should not be writable" );
} )();


/**
 * Unlike other languages such as PHP, the const keyword can have different
 * levels of visibility.
 */
( function testVisibilityModifiersArePermittedWithConstKeyword()
{
    var protval = 'bar',
        privval = 'baz',

        Foo = builder.build(
        {
            'protected const prot': protval,
            'private   const priv': privval,

            'public static getProt': function()
            {
                return this.$('prot');
            },

            'public static getPriv': function()
            {
                return this.$('priv');
            },
        } ),

        // be sure to override each method to ensure we're checking references
        // on the subtype, *not* the parent type
        SubFoo = builder.build( Foo,
        {
            'public static getProt': function()
            {
                return this.$('prot');
            },

            'public static getPriv': function()
            {
                return this.$('priv');
            },
        } )
    ;

    assert.equal( Foo.$('prot'), undefined,
        "Protected constants are not available publicly"
    );

    assert.equal( Foo.$('priv'), undefined,
        "Private constants are not available publicly"
    );

    assert.equal( Foo.getProt(), protval,
        "Protected constants are available internally"
    );

    assert.equal( Foo.getPriv(), privval,
        "Private constants are available internally"
    );

    assert.equal( SubFoo.getProt(), protval,
        "Protected constants are available to subtypes internally"
    );

    assert.equal( SubFoo.getPriv(), undefined,
        "Private constants are NOT available to subtypes internally"
    );
} )();


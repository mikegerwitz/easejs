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

    // XXX: get rid of this disgusting mess; we're mid-refactor and all these
    // dependencies should not be necessary for testing
    ClassBuilder         = common.require( '/ClassBuilder' ),
    MethodWrapperFactory = common.require( '/MethodWrapperFactory' ),
    wrappers             = common.require( '/MethodWrappers' ).standard,

    builder = ClassBuilder(
        common.require( '/MemberBuilder' )(
            MethodWrapperFactory( wrappers.wrapNew ),
            MethodWrapperFactory( wrappers.wrapOverride )
        ),
        common.require( '/VisibilityObjectFactoryFactory' ).fromEnvironment()
    )
;


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


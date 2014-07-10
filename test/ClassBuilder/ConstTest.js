/**
 * Tests const keyword
 *
 *  Copyright (C) 2011, 2012, 2013, 2014 Free Software Foundation, Inc.
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
        this.Sut =  this.require( 'ClassBuilder' );
        this.MethodWrapperFactory = this.require( 'MethodWrapperFactory' );

        this.wrappers = this.require( 'MethodWrappers' ).standard;
    },


    setUp: function()
    {
        // XXX: get rid of this disgusting mess; we're mid-refactor and all
        // these dependencies should not be necessary for testing
        this.builder = this.Sut(
            this.require( 'warn' ).DismissiveHandler(),
            this.require( 'MemberBuilder' )(
                this.MethodWrapperFactory( this.wrappers.wrapNew ),
                this.MethodWrapperFactory( this.wrappers.wrapOverride ),
                this.MethodWrapperFactory( this.wrappers.wrapProxy ),
                this.getMock( 'MemberBuilderValidator' )
            ),
            this.require( 'VisibilityObjectFactoryFactory' )
                .fromEnvironment()
        )
    },


    /** The const keyword should result in a static property. The rationale for
     * this is that, if a value is constant, then instances do not make sense.
     */
    'const keyword declares properties as static': function()
    {
        var val = 'baz',
            Foo = this.builder.build(
            {
                'const foo': val,
            } )
        ;

        this.assertEqual( val, Foo.$('foo'),
            "Const keyword should declare properties as static"
        );
    },


    /**
     * As the name implies, constant properties should not be writable.
     */
    'const keyword creates immutable property': function()
    {
        try
        {
            // this should fail (trying to alter const prop foo)
            this.builder.build( { 'const foo': 'bar'  } ).$( 'foo', 'baz' );
        }
        catch ( e )
        {
            this.assertOk(
                e.message.search( 'foo' ) !== -1,
                "Const modification error should contain name of property"
            );

            return;
        }

        this.fail( "Constant properties should not be writable" );
    },


    /**
     * Unlike other languages such as PHP, the const keyword can have different
     * levels of visibility.
     */
    'Access modifiers are permitted with const keyword': function()
    {
        var protval = 'bar',
            privval = 'baz',

            Foo = this.builder.build(
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

            // be sure to override each method to ensure we're checking
            // references on the subtype, *not* the parent type
            SubFoo = this.builder.build( Foo,
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

        this.assertEqual( Foo.$('prot'), undefined,
            "Protected constants are not available publicly"
        );

        this.assertEqual( Foo.$('priv'), undefined,
            "Private constants are not available publicly"
        );

        this.assertEqual( Foo.getProt(), protval,
            "Protected constants are available internally"
        );

        this.assertEqual( Foo.getPriv(), privval,
            "Private constants are available internally"
        );

        this.assertEqual( SubFoo.getProt(), protval,
            "Protected constants are available to subtypes internally"
        );

        this.assertEqual( SubFoo.getPriv(), undefined,
            "Private constants are NOT available to subtypes internally"
        );
    },
} );


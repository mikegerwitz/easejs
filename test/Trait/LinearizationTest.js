/**
 * Tests trait/class linearization
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
 *
 * GNU ease.js adopts Scala's concept of `linearization' with respect to
 * resolving calls to supertypes; the tests that follow provide a detailed
 * description of the concept, but readers may find it helpful to read
 * through the ease.js manual or Scala documentation.
 */

require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut   = this.require( 'Trait' );
        this.Class = this.require( 'class' );
    },


    /**
     * When a class mixes in a trait that defines some method M, and then
     * overrides it as M', then this.__super within M' should refer to M.
     * Note that this does not cause any conflicts with any class supertypes
     * that may define a method of the same name as M, because M must have
     * been an override, otherwise an error would have occurred.
     */
    'Class super call refers to mixin that is part of a class definition':
    function()
    {
        var _self   = this,
            scalled = false;

        var T = this.Sut(
        {
            // after mixin, this should be the super method
            'virtual public foo': function()
            {
                scalled = true;
            },
        } );

        this.Class.use( T ).extend(
        {
            // overrides mixed-in foo
            'override public foo': function()
            {
                // should invoke T.foo
                try
                {
                    this.__super();
                }
                catch ( e )
                {
                    _self.fail( false, true,
                        "Super invocation failure: " + e.message
                    );
                }
            },
        } )().foo();

        this.assertOk( scalled );
    },
} );


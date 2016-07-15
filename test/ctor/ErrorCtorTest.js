/**
 * Tests error constructor generation
 *
 *  Copyright (C) 2016 Free Software Foundation, Inc.
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

function DummyError() {};

function SubDummyError() {};
SubDummyError.prototype      = new DummyError();
SubDummyError.prototype.name = 'sub dummy name';


require( 'common' ).testCase(
{
    caseSetUp: function()
    {
        this.Sut = this.require( 'ctor/ErrorCtor' );

        // no need to be comprehensive
        this.bases = [ '', {} ];

        // space is intentional, since in IceCat (for example) you get
        // '@debugger eval code' if you get an error in the console
        this.frames = [
            // average case, multiple frames, Mozilla-style
            {
                frames: [
                    "__$$ector$$__@foo.js:1:2",
                    "bar@first-frame.js:1:2",
                    "baz@second other frame:2:2",
                ],

                strip: 1,
                fileName: 'first-frame.js',
                lineNumber: 1,
                columnNumber: 2,
            },
            // average case, multiple frames, Mozilla-style, no-match
            {
                frames: [
                    "__$$no$$__@foo.js:1:2",
                    "bar@first-frame2.js:1:2",
                    "baz@second other frame:2:2",
                ],

                strip: 0,
                fileName: undefined,
                lineNumber: undefined,
                columnNumber: undefined,
            },
            // average case, Mozilla-style, no column number
            {
                frames: [
                    "__$$ector$$__@foo.js:1",
                    "bar@first-frame2.js:2",
                    "baz@second other frame:3",
                ],

                strip: 1,
                fileName: 'first-frame2.js',
                lineNumber: 2,
                columnNumber: undefined,
            },
            // average case, Mozilla-style, no frame name
            {
                frames: [
                    "__$$ector$$__@foo.js:1:1",
                    "@first-frame3.js:2:2",
                    "baz@second other frame:3:3",
                ],

                strip: 1,
                fileName: 'first-frame3.js',
                lineNumber: 2,
                columnNumber: 2,
            },
            // no other frames (but notice the trailing
            // newline), Mozilla-style
            {
                frames: [
                    "__$$ector$$__@foo.js:1:2\n",
                ],

                strip: 1,
                fileName: undefined,
                lineNumber: undefined,
                columnNumber: undefined,
            },

            // average case, multiple frames, V8-style
            {
                frames: [
                    "SomeError",
                    "    at __$$ector$$__ (foo.js:1:2)",
                    "    at bar (first-frame.js:1:2)",
                    "    at baz (second other frame:2:2)",
                ],

                strip: 2,
                fileName: 'first-frame.js',
                lineNumber: 1,
                columnNumber: 2,
            },
            // average case, V8-style, multiple frames, no-match
            {
                frames: [
                    "SomeError",
                    "    at __$$nomatch$$__ (foo.js:1:2)",
                    "    at bar (first-frame.js:1:2)",
                    "    at baz (second other frame:2:2)",
                ],

                strip: 0,
                fileName: undefined,
                lineNumber: undefined,
                columnNumber: undefined,
            },
            // average case, V8-style, no column number
            {
                frames: [
                    "SomeError",
                    "    at __$$ector$$__ (foo.js:1)",
                    "    at bar (first-frame2.js:1)",
                    "    at baz (second other frame:2)",
                ],

                strip: 2,
                fileName: 'first-frame2.js',
                lineNumber: 1,
                columnNumber: undefined,
            },
            // average case, V8-style, no frame name
            {
                frames: [
                    "SomeError",
                    "    at __$$ector$$__ (foo.js:1:2)",
                    "    at (first-frame.js:1:2)",
                    "    at (second other frame:2:2)",
                ],

                strip: 2,
                fileName: 'first-frame.js',
                lineNumber: 1,
                columnNumber: 2,
            },
            // no other frames, V8-style
            {
                frames: [
                    "SomeError",
                    "    at __$$ector$$__ (foo.js:1:2)"
                ],

                strip: 2,
                fileName: 'first-frame.js',
                lineNumber: undefined,
                columnNumber: undefined,
            },
        ];

        // whether line, column, or filename are available in environment
        this.linecolf = [
            { lineNumber: false, columnNumber: false, fileName: true  },
            { lineNumber: true,  columnNumber: false, fileName: true  },
            { lineNumber: false, columnNumber: true, fileName:  true  },
            { lineNumber: true , columnNumber: true, fileName:  true  },
            { lineNumber: false, columnNumber: false, fileName: false },
            { lineNumber: true,  columnNumber: false, fileName: false },
            { lineNumber: false, columnNumber: true, fileName:  false },
            { lineNumber: true , columnNumber: true, fileName:  false },
        ];
    },


    '@each(bases) Throws error if base is not a function': function( obj )
    {
        this.assertThrows( function()
        {
            this.Sut( obj );
        }, TypeError );
    },


    '@each(bases) Throws error if supertype is not a function': function( obj )
    {
        this.assertThrows( function()
        {
            this.Sut( DummyError, obj );
        }, TypeError );
    },


    /**
     * Error messages are set by a `message' property.
     */
    'Sets message via constructor': function()
    {
        var expected = 'foo message';

        this.assertEqual(
            new ( this.Sut( DummyError ).createCtor( DummyError ) )
                ( expected ).message,
            expected
        );
    },


    /**
     * The build-in ECMAScript Error constructors don't cast MESSAGE to a
     * string, so we shouldn't either.
     */
    'Does not cast message to string': function()
    {
        var expected = {};

        this.assertStrictEqual(
            new ( this.Sut( DummyError ).createCtor( DummyError ) )
                ( expected ).message,
            expected
        );
    },


    /**
     * The name of the error is derived from the `name' property.
     */
    'Sets name to class name': function( Type )
    {
        var expected = 'MyError';

        this.assertEqual(
            new (
                this.Sut( DummyError ).createCtor( DummyError, expected )
            )().name,
            expected
        );
    },


    /**
     * ...unless one is not provided, in which case we should retain the
     * parent's.
     *
     * Since the constructor generator doesn't set up the constructor's
     * supertype, this amounts to seeing if it'll fall through if we set the
     * supertype.  We don't want to just check whether `name' is or is not
     * defined on the prototype, since we only care that it works, not how
     * it's done.
     */
    'Defaults name to supertype': function( Type )
    {
        var ctor = this.Sut( DummyError )
            .createCtor( SubDummyError );

        ctor.prototype = new SubDummyError();

        this.assertEqual(
            new ctor().name,
            new SubDummyError().name
        );
    },


    /**
     * JavaScript doesn't make extending Error pleasent---we need to take
     * care of our own stack trace, and that trace isn't going to be
     * entirely correct (because we have an extra stack frame, being in the
     * Error itself).  Furthermore, not all environments support stack.
     *
     * To make matters worse, the proper method of obtaining or overwriting
     * a stack trace also varies.  So, let's emulate some environments.
     */


    /**
     * Certain browsers (like Chromium) support `Error.captureStackTrace',
     * which sets the `stack' property on the given object to either a
     * complete stack trace, or a stack trace below a reference to a given
     * object.  The `stack' property is also defined as a getter, which
     * makes for confusing and frustrating development when you are
     * wondering why setting it does nothing.  (Personal experience
     * perhaps?)
     *
     * Note that the previous tests will implicitly test that
     * `captureStackTrace' is _not_ called when unavailable, because they
     * will fail to call an undefined function.
     */
    'Uses Error.captureStackTrace when available': function()
    {
        var _self    = this,
            expected = 'as expected',
            capture_args;

        function DummyErrorCapture() {};
        DummyErrorCapture.captureStackTrace = function()
        {
            capture_args = arguments;
        };

        var given_ctor = this.Sut( DummyErrorCapture )
            .createCtor( DummyError );

        // if the stack trace were generated now, then that would be bad (as
        // it would be incorrect when the error is actually instantiated)
        this.assertEqual( undefined, capture_args );

        var inst = new given_ctor();

        // destination for `stack' property set
        this.assertStrictEqual( capture_args[ 0 ], inst );

        // relative stack frame
        this.assertStrictEqual( capture_args[ 1 ], given_ctor );
    },


    /**
     * If `Error.captureStackTrace' is _not_ available, we fall back to the
     * good-ol'-fashion overwrite-stack-with-a-super-instance-stack
     * approach, which is conventional.
     */
    'Overwrites `stack\' property if no `captureStackTrace\'': function()
    {
        var expected = 'as expected',
            allow    = false;

        // just something that we can mock the stack on
        function SubDummyError()
        {
            if ( !allow ) return;

            this.stack = expected;
        }

        // this is why stack traces are traditionally a problem unless you
        // remember to explicitly set it; ease.js does it for you
        SubDummyError.prototype       = new DummyError();
        SubDummyError.prototype.stack = 'stack not set';

        var given = this.Sut( DummyError )
            .createCtor( SubDummyError );

        // ensures that this stack is actually from a new object, not the
        // stack that was set on the prototype
        allow = true;
        var result = new given().stack;

        this.assertEqual( result, expected );
    },


    /**
     * If `Error.captureStackTrace' is available and used, then the error
     * constructor itself will not appear in the stack trace.  If we have to
     * set it, however, then it will---this is a consequence of
     * instantiating the supertype within the error constructor in order to
     * get a proper stack trace.
     *
     * We will attempt to strip ourselves from the string if the stack trace
     * string meets certain critiera.
     *
     * Also make sure we don't strip if there is a non-match.  Generally
     * speaking, this won't often (if ever) be the case in practice, but
     * let's never make assumptions.
     */
    '@each(frames) Strips self from stack if no `captureStackTrace\'':
    function( framedata )
    {
        var lines = Array.prototype.slice.call( framedata.frames );

        function SubDummyError()
        {
            this.stack = lines.join( '\n' );
        }

        var ctor = this.Sut( DummyError )
            .createCtor( SubDummyError );

        var result = new ctor().stack;

        this.assertEqual(
            lines.slice( framedata.strip ).join( '\n' ),
            result
        );
    },


    /**
     * Certain browsers (like GNU IceCat) support `{line,column}Number` and
     * `fileName`; if those are defined, we will propagate them.
     *
     * ...but there's a caveat: the values set on the supertype's error
     * object aren't going to be correct, because the first frame is not our
     * own.  That means we have to do some string parsing on the second
     * frame; this will only happen if stack stripping was successful, since
     * we otherwise have no idea if the second frame is actually what we
     * want.
     *
     * Even if we do happen to know the values, if the environment in which
     * we are running does not normally provide those data, then neither
     * will we (for strict consistency).
     */
    '@each(linecolf) Sets line, column, and filename data if available':
    function( linecolf )
    {
        var expected = {
            lineNumber:   5,
            columnNumber: 3,
            fileName:     'foofile.js',
        }

        var lines = [
            "@__$$ector$$__ foo:1:1",
            "@" + expected.fileName + ":" + expected.lineNumber
                + ":" + expected.columnNumber,
            "@second other frame:2:2"
        ];

        function LineColDummyError()
        {
            this.stack = lines.join( '\n' );

            for ( var prop in linecolf )
            {
                if ( !linecolf[ prop ] ) continue;

                // purposefully not an integer; should apply if the key
                // exists at all
                this[ prop ] = undefined;
            }
        }

        var ctor = this.Sut( LineColDummyError )
            .createCtor( LineColDummyError );

        var errobj = new ctor();

        for ( var prop in linecolf )
        {
            if ( linecolf[ prop ] )
            {
                this.assertEqual( expected[ prop ], errobj[ prop ] );
            }
            else
            {
                this.assertOk(
                    !Object.hasOwnProperty.call( errobj, prop )
                );
            }
        }
    },


    /**
     * This tests various situations with regards to the data available in
     * stack traces; see `this.frames` for those cases.
     */
    '@each(frames) Recognizes line, column, and filename when available':
    function( framedata )
    {
        function LineColDummyError()
        {
            this.stack        = framedata.frames.join( '\n' );
            this.lineNumber   = undefined;
            this.columnNumber = undefined;
            this.fileName     = undefined;
        }

        var ctor = this.Sut( LineColDummyError )
            .createCtor( LineColDummyError );

        var errobj = new ctor();

        this.assertEqual( framedata.lineNumber, errobj.lineNumber );
        this.assertEqual( framedata.columnNumber, errobj.columnNumber );
    },


    /**
     * A predicate is provided to allow callers to determine if the given
     * object is our base constructor or a subtype thereof.
     */
    'Provides predicate to recognize base match': function()
    {
        var sut = this.Sut( DummyError );

        this.assertOk( sut.isError( DummyError ) );
        this.assertOk( !sut.isError( new DummyError() ) );

        this.assertOk( sut.isError( SubDummyError ) );
        this.assertOk( !sut.isError( new SubDummyError() ) );

        this.assertOk( !sut.isError( function() {} ) );
    },


    /**
     * A function may optionally be provided to be invoked after the
     * constructor has completed---this allows for the constructor to be
     * augmented in such a way that the top stack frame is still the
     * generated constructor when the error is instantiated.
     */
    'Invokes provided function after self': function()
    {
        var called  = false,
            context = undefined,
            argchk  = {},
            message = 'stillrunctor';

        var result = new (
            this.Sut( DummyError )
                .createCtor( DummyError, '', function()
                {
                    called  = arguments;
                    context = this;
                } )
        )( message, argchk );

        this.assertOk( called );
        this.assertStrictEqual( argchk, called[ 1 ] );
        this.assertStrictEqual( result, context );

        // the ctor itself should also still be called (this depends on
        // previous test also succeeding)
        this.assertEqual( message, result.message );
    },


    /**
     * Don't wait until instantiation to blow up on an invalid AFTER.
     */
    'Throws error given a non-function `after\' argument': function()
    {
        var Sut = this.Sut;

        this.assertThrows( function()
        {
            Sut( DummyError )
                .createCtor( DummyError, '', "oops" );
        }, TypeError );
    },
} );

/**
 * Handles the stupid-complicated error subtyping situation in JavaScript
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
 *
 * Before you wonder why this is so stupid-complicated and question this
 * effort: ease.js supports ECMAScript 3 and later environments.
 *
 * Unless you continue to question because this is JavaScript and,
 * regardless of ECMAScript version, it's still stupid.  Then you'd be
 * right.
 *
 * See test case for comprehensive examples.
 */

/**
 * Constructor generator for Error subtypes
 *
 * BASE should be the supertype of all error prototypes in the environment;
 * this is usually `Error'.  BASE is used to determine what features are
 * available in the particular environment (e.g. `Error.captureStackTrace').
 *
 * The goal is to generate error constructors that will produce errors as
 * close to the form of the environment of BASE as possible: this is _not_
 * an attempt to provide a unified Error interface across all environments;
 * even if we know about certain data line line numbers, if an error from
 * BASE would not normally produce them, then neither will we.
 *
 * @param  {Function}  base  supertype of all error prototypes
 *
 * @return  {ErrorCtor}
 */
function ErrorCtor( base )
{
    if ( !( this instanceof ErrorCtor ) )
    {
        return new ErrorCtor( base );
    }

    if ( typeof base !== 'function' )
    {
        throw TypeError( "Expected constructor for error base" );
    }

    this._base = base;
    this._initDataSupport( base );
};


ErrorCtor.prototype = {
    /**
     * Stack parser-guesser
     *
     * This recognizes Mozilla- and V8-style stack traces containing our
     * unique identifier; other formats might work by chance, but their
     * support is not intentional.
     *
     * There are four match groups, as noted in the regex itself below:
     *   1. The entire stripped stack (if recognized);
     *   2. Filename;
     *   3. Line number; and
     *   4. Column number (might not exist).
     *
     * @type {RegExp}
     */
    _stackre: new RegExp(
        '^' +
            '(?:' +
                '.+?\\n\\s+at ' +          // V8-style 'at' on second line
            ')?' +

            '.*?__\\$\\$ector\\$\\$__' +  // our unique identifier
            '.*(?:\\n|$)' +               // ignore rest of line

            '(' +                         // (stripped stack)
                '(?:' +
                    '.*?[@(]' +           // skip Mozilla/V8 frame name
                    '(.*?)' +             // (filename)
                    ':(\\d+)' +           // (line)
                    '(?::(\\d+))?' +      // (column)
                    '.*?\\n' +            // ignore rest of line
                ')?' +
                '(?:.|\\n)*' +            // include rest of stack
            ')?' +
        '$'
    ),

    /**
     * Base error constructor (usually Error)
     * @type {Function}
     */
    _base: {},


    /**
     * Create error constructor
     *
     * Note that, as this is intended for use as a constructor for ease.js
     * classes, this will _not_ set up the prototype as a subtype of
     * SUPERTYPE---the caller is expected to do so.
     *
     * AFTER, if provided, will be invoked at the end of the constructor;
     * this allows the topmost frame to still be the error constructor,
     * rather than having it wrapped to introduce additional logic.
     *
     * @param  {Function}   supertype  parent error constructor
     * @param  {string}     name       error subtype name
     * @param  {?Function}  after      function to invoke after ctor
     *
     * @return  {function(string)}  error constructor
     */
    createCtor: function( supertype, name, after )
    {
        if ( typeof supertype !== 'function' )
        {
            throw TypeError( "Expected constructor for supertype" );
        }

        if ( ( after !== undefined ) && ( typeof after !== 'function' ) )
        {
            throw TypeError( "Expected function as `after' argument" );
        }

        var _self = this;

        // yes, this name is important, as we use it as an identifier for
        // stack stripping (see `#_parseStack')
        function __$$ector$$__( message )
        {
            this.message = message;
            _self._setStackTrace( this, _self._base, supertype );

            after && after.apply( this, arguments );
        }

        // it's important to let the name fall through if not provided
        if ( name !== undefined )
        {
            __$$ector$$__.prototype.name = name;
        }

        return __$$ector$$__;
    },


    /**
     * Create stack trace using appropriate method for environment
     *
     * If BASE has a `captureStackStrace' method, then it will be used with
     * DEST as the destination and SUPERTYPE as the relative object for the
     * stack frames.  Otherwise, `DEST.stack' will be overwritten with the
     * `stack' produces by instantiating SUPERTYPE, which is the
     * conventional approach.
     *
     * @param  {Object}    dest       destination object for values
     * @param  {Function}  base       supertype of all errors
     * @param  {Function}  supertype  supertype of new error
     *
     * @return  {undefined}
     */
    _setStackTrace: function( dest, base, supertype )
    {
        if ( typeof base.captureStackTrace === 'function' )
        {
            base.captureStackTrace( dest, dest.constructor );
            return;
        }

        var super_inst = new supertype(),
            stack_data = this._parseStack( super_inst.stack );

        dest.stack = stack_data.stripped;

        if ( this._lineSupport )
        {
            dest.lineNumber = stack_data.line;
        }

        if ( this._columnSupport )
        {
            dest.columnNumber = stack_data.column;
        }

        if ( this._filenameSupport )
        {
            dest.fileName = stack_data.filename;
        }
    },


    /**
     * Attempt to extract stack frames below self, as well as the line and
     * column numbers (if available)
     *
     * The provided string STACK should be the full stack trace.  It will be
     * parsed to ensure that the first stack frame matches a unique
     * identifier for the error constructor, and then return the following:
     *
     *   `full':     original STACK;
     *   `stripped': stack trace with first frame stripped, if matching;
     *   `filename': filename from the first non-error frame, if matching;
     *   `line':     line number from first non-error frame, if matching;
     *   `column':   column number from first non-error frame, if matching.
     *
     * @param  {string}  stack  full stack trace
     *
     * @return  {Object}  full, stripped, line, column
     */
    _parseStack: function( stack )
    {
        var match = ( typeof stack === 'string' )
            ? stack.match( this._stackre )
            : null;

        if ( match )
        {
            // these undefined defaults deal with older environments
            // (e.g. IE<9) returning an empty string rather than undefined
            // for non-matches (note that !!"0"===true, so we're okay)
            return {
                full:     stack,
                stripped: match[ 1 ] || '',
                filename: match[ 2 ] || undefined,
                line:     match[ 3 ] || undefined,
                column:   match[ 4 ] || undefined
            };
        }

        return {
            full:     stack,
            stripped: stack
        };
    },


    /**
     * Initialize with whether line, column, and/or filenames are supported
     * by the environment (of BASE)
     *
     * Some environments (e.g. GNU IceCat) support line and column
     * numbers.  Others (like older versions of a certain proprietary
     * browser) only support line numbers.  Others support neither.
     *
     * The reason for this very specific distinction is strict consistency:
     * we want to produce errors of the exact same form as those created by
     * BASE.
     *
     * Below, we check for the value on the prototype chain first and, upon
     * failing to find anything, then check to see if the field exists at
     * all on an instance of BASE.
     *
     * This method sets `_{line,column,filename}Support`.
     *
     * @param  {Function}  base  supertype of all errors
     *
     * @return {undefined}
     */
    _initDataSupport: function( base )
    {
        var chk    = new base(),
            hasOwn = Object.hasOwnProperty;

        this._lineSupport = ( chk.lineNumber !== undefined )
            || hasOwn.call( chk, 'lineNumber' );

        this._columnSupport = ( chk.columnNumber !== undefined )
            || hasOwn.call( chk, 'columnNumber' );

        this._filenameSupport = ( chk.fileName !== undefined )
            || hasOwn.call( chk, 'fileName' );
    },


    /**
     * Whether the given TYPE is our base error constructor or a subtype
     *
     * @param  {Function}  type  constructor to check against our base
     *
     * @return  {boolean}  whether TYPE is our base constructor or a subtype
     */
    isError: function( type )
    {
        return ( type === this._base )
            || ( type.prototype instanceof this._base );
    },
};


module.exports = ErrorCtor;

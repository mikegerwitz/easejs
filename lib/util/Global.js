/**
 * Global scope handling
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
 */

// retrieve global scope; works with ES5 strict mode
(0,eval)( 'var _the_global=this' );

// prototype to allow us to augment the global scope for our own purposes
// without polluting the global scope
function _G() {}
_G.prototype = _the_global;


/**
 * Provides access to and augmentation of global variables
 *
 * This provides a static method to consistently provide access to the
 * object representing the global scope, regardless of environment. Through
 * instantiation, its API permits augmenting a local object whose prototype
 * is the global scope, providing alternatives to variables that do not
 * exist.
 */
function Global()
{
    // allows omitting `new` keyword, consistent with ease.js style
    if ( !( this instanceof Global ) )
    {
        return new Global();
    }

    // do not pollute the global scope (previously, _the_global was used as
    // the prototype for a new object to take advantage of native overrides,
    // but unfortunately IE<=8 did not support this and always returned
    // undefined values from the prototype).
    this._alt = {};
}


/**
 * Provides consistent access to the global scope through all ECMAScript
 * versions, for any root variable name, and works with ES5 strict mode.
 *
 * As an example, Node.js exposes the variable `root` to represent global
 * scope, but browsers expose `window`. Further, ES5 strict mode will
 * provide an error when checking whether `typeof SomeGlobalVar ===
 * 'undefined'`.
 *
 * @return  {Object}  global object
 */
Global.expose = function()
{
    return _the_global;
};


Global.prototype = {
    /**
     * Provide a value for the provided global variable name if it is not
     * defined
     *
     * A function returning the value to assign to NAME should be provided,
     * ensuring that the alternative is never even evaluated unless it is
     * needed.
     *
     * The global scope will not be polluted with this alternative;
     * consequently, you must access the value using the `get` method.
     *
     * @param  {string}      name  global variable name
     * @param  {function()}  f     function returning value to assign
     *
     * @return  {Global}  self
     */
    provideAlt: function( name, f )
    {
        if ( ( _the_global[ name ] !== undefined )
            || ( this._alt[ name ] !== undefined )
        )
        {
            return;
        }

        this._alt[ name ] = f();
        return this;
    },


    /**
     * Retrieve global value or provided alternative
     *
     * This will take into account values provided via `provideAlt`; if no
     * alternative was provided, the request will be deleagated to the
     * global variable NAME, which may or may not be undefined.
     *
     * No error will be thrown if NAME is not globally defined.
     *
     * @param  {string}  name  global variable name
     *
     * @return  {*}  value associated with global variable NAME or
     *               its provided alternative
     */
    get: function( name )
    {
        return ( this._alt[ name ] !== undefined )
            ? this._alt[ name ]
            : _the_global[ name ];
    },
};

module.exports = Global;


/**
 * Builds method wrappers
 *
 *  Copyright (C) 2011, 2012, 2013 Free Software Foundation, Inc.
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

/**
 * Initializes factory to wrap methods
 *
 * @param  {function(Function,Function,number)}  factory  function that will
 *                                                        perform the actual
 *                                                        wrapping
 *
 * @constructor
 */
module.exports = exports = function MethodWrapperFactory( factory )
{
    // permit omission of the 'new' keyword for instantiation
    if ( !( this instanceof exports ) )
    {
        // module.exports for Closure Compiler
        return new module.exports( factory );
    }

    this._factory = factory;
};


/**
 * Wraps the provided method
 *
 * The returned function is determined by the factory function provided when the
 * MethodWrapperFactory was instantiated.
 *
 * @param  {function()}  method        method to wrap
 * @param  {function()}  super_method  super method, if overriding
 * @param  {number}      cid           class id that method is associated with
 * @param  {function()}  getInst       function to determine instance and return
 *                                     associated visibility object
 * @param  {string=}     name          name of method
 * @param  {Object=}     keywords      method keywords
 */
exports.prototype.wrapMethod = function(
    method, super_method, cid, getInst, name, keywords
)
{
    return this._factory( method, super_method, cid, getInst, name, keywords );
};


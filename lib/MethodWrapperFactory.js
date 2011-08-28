/**
 * Builds method wrappers
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
 * @package core
 */


/**
 * Initializes factory to wrap methods
 *
 * @param  {function()}  getInst  function to determine instance and return
 *                                associated visibility object
 *
 * @param  {function(function(),function(),number)}  factory  function that will
 *                                                            perform the actual
 *                                                            wrapping
 */
module.exports = exports = function MethodWrapperFactory( getInst, factory )
{
    // permit omission of the 'new' keyword for instantiation
    if ( !( this instanceof exports ) )
    {
        return new exports( getInst, factory );
    }

    this._getInst = getInst;
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
 */
exports.prototype.wrapMethod = function( method, super_method, cid )
{
    return this._factory( method, super_method, cid, this._getInst );
};


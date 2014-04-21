/**
 * Handles building members (properties, methods) in a pre-ES5 environment
 *
 *  Copyright (C) 2011, 2013 Free Software Foundation, Inc.
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
 * Supertype
 */
var MemberBuilder = require( './MemberBuilder' );

/**
 * Responsible for building class members
 */
module.exports = exports = function FallbackMemberBuilder(
    wrap_method, wrap_override
)
{
    // permit omitting 'new' keyword
    if ( !( this instanceof module.exports ) )
    {
        return new module.exports( wrap_method, wrap_override );
    }

    // invoke parent constructor
    module.exports.prototype.constructor.call( this,
        wrap_method, wrap_override
    );
};

// inherit from MemberBuilder
module.exports.prototype   = new MemberBuilder();
module.exports.constructor = module.exports;


/**
 * Getters/setters are unsupported in a pre-ES5 environment
 *
 * Simply throw an exception, as it clearly represents that the developer did
 * not account for the possibility that their software may have been executed in
 * a pre-ES5 environment.
 */
exports.prototype.buildGetterSetter = function()
{
    throw Error( 'Getters/setters are unsupported in this environment' );
};

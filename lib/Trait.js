/**
 * Provides system for code reuse via traits
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
 */


function Trait()
{
    switch ( arguments.length )
    {
        case 1:
            return Trait.extend.apply( this, arguments );
            break;
    }
};


Trait.extend = function( dfn )
{
    function TraitType()
    {
        throw Error( "Cannot instantiate trait" );
    };

    TraitType.__trait = true;
    TraitType.__dfn   = dfn;

    return TraitType;
};


Trait.isTrait = function( trait )
{
    return !!( trait || {} ).__trait;
};


/**
 * Mix trait into the given definition
 *
 * The original object DFN is modified; it is not cloned.
 *
 * @param  {Trait}   trait  trait to mix in
 * @param  {Object}  dfn    definition object to merge into
 *
 * @return  {Object}  dfn
 */
Trait.mixin = function( trait, dfn )
{
    var tdfn = trait.__dfn || {};
    for ( var f in tdfn )
    {
        dfn[ f ] = tdfn[ f ];
    }

    return dfn;
};


module.exports = Trait;

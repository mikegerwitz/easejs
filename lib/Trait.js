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
 * TODO: we could benefit from processing the keywords now (since we need
 * the name anyway) and not re-processing them later for the class.
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
        // this is a simple check that will match only when all keywords,
        // etc are the same; we expect that---at least for the time
        // being---class validations will ensures that redefinitions do not
        // occur when the field strings vary
        if ( dfn[ f ] )
        {
            // TODO: conflcit resolution
            throw Error( "Trait field `" + f + "' conflits" );
        }
        else if ( f.match( /\b__construct\b/ ) )
        {
            throw Error( "Traits may not define __construct" );
        }

        dfn[ f ] = tdfn[ f ];
    }

    return dfn;
};


module.exports = Trait;

/**
 * Page enhancements for ease.js website
 *
 *  Copyright (C) 2010 Mike Gerwitz
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

( function()
{
    var $trybox = null,
        $trybtn = null
    ;

    $( document ).ready( function()
    {
        var $ex     = $( '.ex' ),
            content = $ex.text().replace( /^ *\n/, '' ),
            $txt;

        $ex.text( '' )
            .removeClass( 'excode' )
            .append( $txt = $( '<textarea>' )
                .addClass( 'excode' )
                .text( content )
            )
            .append( $( '<div>' )
                .addClass( 'btns' )
                .append( $( '<div>' )
                    .text( 'try it' )
                    .addClass( 'btn go' )
                    .click( function()
                    {
                        runScript( $txt.val() );
                    } )
                )
            );
    } );


    function runScript( script )
    {
        var Class         = easejs.Class,
            FinalClass    = easejs.FinalClass,
            AbstractClass = easejs.AbstractClass,
            Interface     = easejs.Interface,

            $console = $( '<textarea>' )
                .attr( {
                    id:       'try-console',
                    readonly: 'readonly'
                } ),

            $dialog = $( '<div>' )
                .append( $console )
                .dialog( {
                    title:  'Console',
                    modal:  true,
                    width:  '800px',
                    height: 'auto'
                } ),

            console = {
                log: function( text )
                {
                    $console.text(
                        $console.text() + text + "\n"
                    );
                },

                warn: function( text )
                {
                    $console.text(
                        $console.text() + "[Warning] " + text + "\n"
                    );
                },
            };

        ( function( console )
        {
            try
            {
                eval( script );
            }
            catch ( e )
            {
                console.log( e );
            }
        } )( console );
    }
} )();


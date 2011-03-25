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
    var $trybox = null;

    $( document ).ready( function()
    {
        appendTry();
    } );


    function appendTry()
    {
        $( '<div>' )
            .attr( 'id', 'try' )
            .text( 'Try It!' )
            .addClass( 'btn' )
            .addClass( 'large' )
            .addClass( 'glow' )
            .mousedown( function( event )
            {
                // prevent dragging from highlighting the text (so it looks more
                // like an image)
                event.preventDefault();
            } )
            .click( function( event )
            {
                var $try = getTry();

                $( this ).text(
                    ( $try.is( ':visible' ) )
                        ? 'Try It!'
                        : 'Hide It'
                );

                $try.slideToggle();
            } )
            .appendTo( '#header' );
    }


    function getTry()
    {
        var $txt;

        return $trybox || ( function createTryBox()
        {
            return $trybox = $( '<div>' )
                .attr( 'id', 'trybox' )
                .hide()
                .append( $( '<h2>' ).text( 'Try ease.js' ) )
                .append( $txt = $( '<textarea>' ).text (
                    "Test"
                ) )
                .append( $( '<div>' )
                    .attr( 'id', 'trybtns' )
                    .append( $( '<div>' )
                        .attr( 'id', 'run' )
                        .text( 'Run' )
                        .addClass( 'btn' )
                        .addClass( 'med' )
                        .addClass( 'green' )
                        .click( function()
                        {
                            var Class = easejs.Class;
                            eval( $txt.val() );
                        } )
                    )
                )
                .prependTo( '#content' );
        } )();
    }
} )();


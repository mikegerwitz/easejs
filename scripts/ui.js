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
        appendTry();

        if ( document.location.href.substr( -6 ) === '#tryit' )
        {
            console.log( 'ok' );
            toggleTry();
        }
    } );


    function appendTry()
    {
        $trybtn = $( '<div>' )
            .attr( 'id', 'try' )
            .text( 'Try It' )
            .addClass( 'btn large glow' )
            .mousedown( function( event )
            {
                // prevent dragging from highlighting the text (so it looks more
                // like an image)
                event.preventDefault();
            } )
            .click( function( event )
            {
                toggleTry();
            } )
            .appendTo( '#header-content' );
    }


    function toggleTry()
    {
        var $try = getTry();

        $trybtn.text(
            ( $try.is( ':visible' ) )
                ? 'Try It'
                : 'Hide It'
        );

        $try.slideToggle();
    }


    function getTry()
    {
        var $txt;

        return $trybox || ( function createTryBox()
        {
            $txt = $( '<textarea>' );

            $.get( 'scripts/ex/class.js', function( data )
            {
                $txt.text( data );
            } );

            return $trybox = $( '<div>' )
                .attr( 'id', 'trybox' )
                .hide()
                .append( $( '<h2>' ).text( 'Try ease.js' ) )
                .append( $( '<p>' ).html(
                    "Enter or modify a test script below. The common " +
                    "ease.js modules, such as <tt>Class</tt>, have " +
                    "already been imported for you. When you are ready, " +
                    "click <strong>Run</strong> to run the script."
                ) )
                .append( $txt )
                .append( $( '<div>' )
                    .attr( 'id', 'trybtns' )
                    .append( $( '<div>' )
                        .attr( 'id', 'run' )
                        .text( 'Run' )
                        .addClass( 'btn med green' )
                        .click( function()
                        {
                            runScript( $txt.val() );
                        } )
                    )
                )
                .prependTo( '#content' );
        } )();
    }


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
                        $console.text() + "\n" + text
                    );
                }
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


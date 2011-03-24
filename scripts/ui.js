/**
 * Page enhancements for ease.js website
 *
 *  Copyright (C) 2010 Mike Gerwitz
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
        return $trybox || ( function createTryBox()
        {
            return $trybox = $( '<div>' )
                .attr( 'id', 'trybox' )
                .hide()
                .prependTo( '#content' );
        } )();
    }
} )();


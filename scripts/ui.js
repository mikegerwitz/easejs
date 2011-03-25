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


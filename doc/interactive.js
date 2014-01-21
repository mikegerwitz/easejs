/**
 * Makes HTML documentation interactive
 */

var head       = document.getElementsByTagName( 'head' )[ 0 ],
    sjquery    = document.createElement( 'script' ),
    sjquery_ui = document.createElement( 'script' ),
    css        = document.createElement( 'link' );

sjquery.type = sjquery_ui.type = 'text/javascript';

css.type = 'text/css';
css.rel  = 'stylesheet';

sjquery.src  =
    'https://ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js';

head.appendChild( sjquery );

// will call callback when jQuery has been loaded
function jqueryCheck( callback )
{
    if ( typeof $ === 'undefined' )
    {
        // check again in 50ms
        setTimeout( function()
        {
            jqueryCheck( callback );
        }, 50 );

        return;
    }

    callback();
}

jqueryCheck( function()
{
    $( document ).ready( function()
    {
        // syntax highlighting for code samples
        $( '.verbatim, .samp, .code, .example' ).each(
            function( i, element )
            {
                hljs.highlightBlock( element, '    ' );
            }
        );

        // quick-n-dirty sub and super script impl (it is by no means
        // perfect)
        $( 'var:contains("\\")' ).each( function()
        {
            var $this = $( this );

            $this.html(
                $this.html().replace( /(\\.*)$/, '<div>$1</div>' )
                .replace( /\\_([^ \\]+)/, '<sub>$1</sub>' )
                .replace( /\\\^([^ \\]+)/, '<sup>$1</sup>' )
                .replace( /(<\/su[bp]><su[bp])>/, '$1 class="left">' )
            );
        } );
    } );
} );


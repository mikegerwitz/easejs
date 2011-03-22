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
sjquery_ui.src =
    'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.11/jquery-ui.min.js';
css.href =
    'http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.10/themes/base/jquery-ui.css';

head.appendChild( sjquery );
head.appendChild( sjquery_ui );
head.appendChild( css );


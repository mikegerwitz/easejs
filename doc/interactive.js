/**
 * Makes HTML documentation interactive
 *
 * @licstart  The following is the entire license notice for the JavaScript
 * code in this page.
 *
 *  Copyright (C) 2011  Free Software Foundation, Inc.
 *
 *  This program is free software: you can redistribute it and/or modify it
 *  under the terms of the GNU General Public License as published by the
 *  Free Software Foundation, either version 3 of the License, or (at your
 *  option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice for the JavaScript code
 * in this page.
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


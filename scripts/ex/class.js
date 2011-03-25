/**
 * Basic class declaration example
 */

var Dog = Class( 'Dog',
{
    'public bark': function()
    {
        console.log( 'Woof!' );
    }
} );

Dog().bark();


/**
 * Basic class declaration example
 */

// Define class Dog
var Dog = Class( 'Dog',
{
    'private _name': '',


    __construct: function( name )
    {
        this._name = name;
    },


    'public bark': function()
    {
        console.log( this._name + ' says: Woof!' );
    }
} );

// invoke method 'bark' on a new instance of 'Dog'
Dog( 'Fluffy' ).bark();

// alternatively, we can use the 'new' keyword
var inst = new Dog( 'Rompie' );
inst.bark();


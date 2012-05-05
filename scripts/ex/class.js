var Class = easejs.Class;

var Stack = Class( 'Stack',
{
    'private _stack': [],

    'public push': function( value )
    {
        this._stack.push( value );
    },

    'public pop': function()
    {
        return this._stack.pop();
    },
} );

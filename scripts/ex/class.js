const { Class } = easejs;

const Stack = Class( 'Stack',
{
    'private _stack': [],

    'public push'( value )
    {
        this._stack.push( value );
    },

    'public pop'()
    {
        return this._stack.pop();
    },
} );

var Foo = Class(
    'private _name': '',

    __construct: function( name )
    {
        this._name = ''+( name );
    },

    'public sayHello': function()
    {
        return this._name + " says 'Hello!'";
    },
);

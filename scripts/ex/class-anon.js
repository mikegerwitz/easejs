const Foo = Class(
    'private _name': '',

    constructor( name )
    {
        this._name = ''+( name );
    },

    'public sayHello'()
    {
        return this._name + " says 'Hello!'";
    },
);

var Cow = Class( 'Cow',
{
    'const LEGS': 4,

    'private static _number': 0,

    __construct: function()
    {
        // __self refers to the class associated with this instance
        this.__self.$( '_number' ) = this.__self.$( 'number' ) + 1;
    },

    'public static create': function()
    {
        return Cow();
    },

    'public static getNumber': function(){
    {
        return this.__self.$( '_number' );
    },
} );

Cow.$( 'LEGS' ); // 4
Cow.getNumber(); // 0
Cow.create();
Cow.getNumber(); // 1

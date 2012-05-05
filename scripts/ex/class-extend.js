var Cow = Class( 'Cow',
{
    'virtual public tip': function()
    {
        return "Omph.";
    },
} );

var SturdyCow = Class( 'SturdyCow' )
    .extend( Cow,
{
    'override public tip': function()
    {
        return "Moo.";
    },
} );

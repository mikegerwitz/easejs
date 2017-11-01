const Cow = Class( 'Cow',
{
    'virtual public tip'()
    {
        return "Omph.";
    },
} );

const SturdyCow = Class( 'SturdyCow' )
    .extend( Cow,
{
    'override public tip'()
    {
        return "Moo.";
    },
} );

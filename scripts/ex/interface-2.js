var ConcreteFilesystem = Class( 'ConcreteFilesystem' )
    .implement( Filesystem )  // multiple interfaces as separate arguments
{
    'public open': function( path, mode )
    {
        return { path: path, mode: mode };
    },

    'public read': function( handle, length )
    {
        return "";
    },

    'public write': function( handle, data )
    {
        // ...
        return data.length;
    },

    'public close': function( handle )
    {
        // ...
        return this;
    },
} );

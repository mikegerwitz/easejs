const ConcreteFilesystem = Class( 'ConcreteFilesystem' )
    .implement( Filesystem )  // multiple interfaces as separate arguments
{
    'public open'( path, mode )
    {
        return { path: path, mode: mode };
    },

    'public read'( handle, length )
    {
        return "";
    },

    'public write'( handle, data )
    {
        // ...
        return data.length;
    },

    'public close'( handle )
    {
        // ...
        return this;
    },
} );

const Filesystem = Interface( 'Filesystem',
{
    'public open': [ 'path', 'mode' ],

    'public read': [ 'handle', 'length' ],

    'public write': [ 'handle', 'data' ],

    'public close': [ 'handle' ],
} );

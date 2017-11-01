const Database = AbstractClass( 'Database',
{
    'public connect'( user, pass )
    {
        if ( !( this.authenticate( user, pass ) ) )
        {
            throw Error( "Authentication failed." );
        }
    },

    // abstract methods define arguments as an array of strings
    'abstract protected authenticate': [ 'user', 'pass' ],
} );

const MongoDatabase = Class( 'MongoDatabase' )
    .extend( Database,
{
    // must implement each argument for Database.authenticate()
    'protected authenticate'( user, pass )
    {
        // ...
    },
} );

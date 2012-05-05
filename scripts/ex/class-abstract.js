var Database = AbstractClass( 'Database',
{
    'public connect': function( user, pass )
    {
        if ( !( this.authenticate( user, pass ) ) )
        {
            throw Error( "Authentication failed." );
        }
    },

    // abstract methods define arguments as an array of strings
    'abstract protected authenticate': [ 'user', 'pass' ],
} );

var MongoDatabase = Class( 'MongoDatabase' )
    .extend( Database,
{
    // must implement each argument for Database.authenticate()
    'protected authenticate': function( user, pass )
    {
        // ...
    },
} );

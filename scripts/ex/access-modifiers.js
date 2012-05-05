var DatabaseRecord = Class( 'DatabaseRecord',
{
    'private _connection': null,


    __construct: function( host, user, pass )
    {
        this._connection = this._connect( host, user, pass );
    },

    'private _connect': function( host, user, pass )
    {
        // (do connection stuff)
        return { host: host };
    },

    'protected query': function( query )
    {
        // perform query on this._connection, rather than exposing
        // this._connection to subtypes
    },

    'protected escapeString': function( field )
    {
        return field.replace( "'", "\\'" );
    },

    'public getName': function( id )
    {
        return this._query(
            "SELECT name FROM users WHERE id = '" +
            this._escapeString( id ) + "' LIMIT 1"
        );
    },
} );

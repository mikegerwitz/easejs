const DatabaseRecord = Class( 'DatabaseRecord',
{
    'private _connection': null,


    constructor( host, user, pass )
    {
        this._connection = this._connect( host, user, pass );
    },

    'private _connect'( host, user, pass )
    {
        // (do connection stuff)
        return { host: host };
    },

    'protected query'( query )
    {
        // perform query on this._connection, rather than exposing
        // this._connection to subtypes
    },

    'protected escapeString'( field )
    {
        return field.replace( "'", "\\'" );
    },

    'public getName'( id )
    {
        return this._query(
            "SELECT name FROM users WHERE id = '" +
            this._escapeString( id ) + "' LIMIT 1"
        );
    },
} );
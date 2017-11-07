const Echo = Class( 'Echo',
{
    'virtual public echo'( str )
    {
        return str;
    },
} );

const Prefix = Trait( 'Prefix' )
    .extend( Echo,
{
    'private _prefix': '',

    __mixin( prefix )
    {
        this._prefix = ''+prefix;
    },

    'public abstract override echo'( str )
    {
        return this._prefix + this.__super( str );
    },
} );

const Suffix = Trait( 'Suffix' )
    .extend( Echo,
{
    'private _suffix': '',

    __mixin( suffix )
    {
        this._suffix = ''+suffix;
    },

    'public abstract override echo'( str )
    {
        return this.__super( str ) + this._suffix;
    },
} );

const UpperCase = Trait( 'UpperCase' )
    .extend( Echo,
{
    'public abstract override echo'( str )
    {
        return this.__super( str ).toUpperCase();
    }
} );

// stackable, parameterized traits
Echo.use( Prefix( "Bar" ) )
    .use( Suffix( "Baz" ) )
    .use( UpperCase )
    .use( Prefix( "Foo" ) )
    .use( Suffix( "Quux" ) )().echo( "Inner" );

// result: FooBARINNERBAZQuux

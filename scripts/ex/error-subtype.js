const MyError = Class( 'MyError' )
    .extend( Error, {} );

const e = MyError( 'Foo' );
e.message;  // Foo
e.name;     // MyError

// -- if supported by environment --
e.stack;         // stack beginning at caller
e.fileName;      // caller filename
e.lineNumber;    // caller line number
e.columnNumber;  // caller column number

// general case
throw MyError( 'Foo' );

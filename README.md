# ease.js

ease.js is (to be) a basic collection of CommonJS modules intended to
"ease" the transition into JavaScript from other Object-Oriented languages. It
provides an intuitive means of achieving classical inheritance and has planned
support traits/mixins.

Current support includes:

* Easy class creation
* Classical inheritance
* Abstract classes and methods
* Interfaces
* Near-completed visibility support in `visibility/master` branch

**This project is still under development.**

## Why ease.js?
There are already plenty of other means of achieving each of this project's
goals, so what's the point of ease.js? The aim of the project is to provide a
lightweight library in a CommonJS format which also addresses ES5 issues and is
an all-inclusive solution to OO techniques. It satisfies primarily a personal
itch.


## How to Use
Please note that, as the project is under active development, the API may change
until the first release.

This module uses the [CommonJS](http://commonjs.org) module format. In the
examples below, [Node.js](http://nodejs.org) is used.

### Creating Classes
If creating a class from scratch, then the process involves extending the base
class. The constructor is provided as the `__construct()` method (influenced by
[PHP](http://php.net)).

    var Class = require( 'easejs' ).Class;

    var Foo = Class.extend(
    {
        foo: '',

        __construct: function( foo )
        {
            this.foo = foo;
        },

        someMethod: function()
        {
            console.log( 'someMethod() called' );
        },
    });

### Extending Classes
Classes may inherit from one-another. If the supertype was created using
`Class.extend()`, a convenience `extend()` method has been added to it. Classes
that were not created via `Class.extend()` can still be extended by passing it
as the first argument to `Class.extend()`.

Multiple inheritance is not supported. ease.js is very generous with the options
it provides to developers as alternatives, so pick whichever flavor your are
most comfortable with: interfaces, traits or mixins. Multiple inheritance will
not be added in the future due to its problems which have been addressed by
interfaces and traits.

**Note that interfaces, traits and mixins are not yet available. They are
planned features and should be available shortly.**

    var SubFoo = Foo.extend(
    {
        anotherMethod: function()
        {
        },
    });

    // if Foo was not created via Class.extend(), this option may be used (has
    // the same effect as above, even if Foo was created using Class.extend())
    var SubFoo = Class.extend( Foo,
    {
        anotherMethod: function()
        {
        },
    });

### Abstract Classes
Abstract classes require that their subtypes implement certain methods. They
cannot be instantiated. Classes are automatically considered to be abstract if
they contain one or more abstract methods.

    var Class = require( 'easejs' ).Class;

    var AbstractFoo = Class.extend(
    {
        // a function may be provided if you wish the subtypes to implement a
        // certain number of arguments
        'abstract fooBar': [ 'arg' ],

        // alternatively, you needn't supply implementation details
        'abstract fooBar2': [],
    });

If the abstract method provides implementation details (as shown by
`fooBar()`, subtypes must implement at least that many arguments or an exception
will be thrown. This ensures consistency between supertypes and their subtypes.

Abstract classes can be extended from just as an other class. In order for its
subtype to be instantiated, it must provide concrete implementations of each
abstract method. If any methods are left as abstract, then the subtype too will
be considered abstract.

    // can be instantiated because concrete methods are supplied for both
    // abstract methods
    var ConcreteFoo = AbstractFoo.extend(
    {
        fooBar: function( arg )
        {
        },

        fooBar2: function()
        {
        },
    });

    // cannot be instantiated because one abstract method remains
    var StillAbstractFoo = AbstractFoo.extend(
    {
        fooBar: function( arg )
        {
        },
    });

You may determine if a class is abstract by calling its `isAbstract()` method.
The abstract methods are available as a read-only `abstractMethods` property.

    Foo.isAbstract();              // false
    SubFoo.isAbstract();           // false
    AbstractFoo.isAbstract();      // true
    Concretefoo.isAbstract();      // false
    StillAbstractFoo.isAbstract(); // true


## Use of Reserved Words
Though JavaScript doesn't currently implement classes, interfaces, etc, it does
reserve the keywords. In an effort to ensure that ease.js will not clash, the
following precautions are taken:

* `Class` is used with a capital 'C'
* `Interface` is used with a capital 'I'
* Reserved keywords are quoted when used (e.g. in property strings)


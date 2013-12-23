# GNU ease.js

GNU ease.js is a classical object-oriented framework for Javascript, intended to
eliminate boilerplate code and "ease" the transition into JavaScript from other
object-oriented languages.

Current support includes:

* Simple and intuitive class definitions
* Classical inheritance
* Abstract classes and methods
* Interfaces
* Visibility (public, protected and private members)
* Static and constant members

While the current focus of the project is object-oriented design, it is likely
that ease.js will expand to other paradigms in the future.

**This project is under active development. Please see the manual for more
information.**

## Full Documentation
Full documentation is available at the following URL:

http://easejs.org/manual/ (Multiple Pages)

http://easejs.org/manual.html (Single Page)

## Bug Reports / Feature Requests
Please direct bug reports and feature requests to the bug tracker located at
http://easejs.org/bugs/

## Why ease.js?
There are already a number of libraries/frameworks that permit basic classical
object-oriented development, so why ease.js? While many of the existing
solutions certainly provide viable solutions, they are largely incomplete. Until
the appearance of ECMAScript 5, many of the features enjoyed by classical OO
developers were elusive to JavaScript.  The aim of this project is to provide an
intuitive framework in a CommonJS format which also addresses ES5 issues and is
an all-inclusive solution to OO techniques.

ECMAScript reserves certain keywords that hint at classical OO in future
versions, but said features are uncertain. ease.js will satisfy the classical OO
itch until the time where ECMAScript itself includes it, at which time ease.js
will still be useful for providing a transition in order to support older
browsers. ease.js may also be useful in the future to augment the feature set of
whatever native ECMAScript implementation is decided upon.

### Why Classical OOP in JavaScript?
ease.js was created (historically) for a number of reasons:

* To "ease" object-oriented developers into JavaScript by providing a familiar
  environment.
* To provide the maintenance and development benefits of classical OOP.
* To provide features missing from the language, such as proper encapsulation
  through private/protected members, interfaces, traits, intuitive inheritance,
  etc.
* To encapsulate the hacks commonly used to perform the above tasks.

Many JS purists believe that classical object-oriented programming should be
left out of the language and one should stick strictly to prototypal
development. While the two are related (both object-oriented), they can be
applied to different problem domains in order to achieve results that are more
natural or intuitive to developers. ease.js works seamlessly with existing
prototypes, allowing the developer to choose whether or not they want to use
"classes".


## How to Use
Please note that, as the project is under active development, the API may change
until the first release.

ease.js uses the [CommonJS](http://commonjs.org) module format. In the
examples below, [Node.js](http://nodejs.org) is used.

### Defining Classes
The constructor is provided as the `__construct()` method (influenced by
[PHP](http://php.net)).

````javascript
    var Class = require( 'easejs' ).Class;

    // anonymous class definition
    var Dog = Class(
    {
        'private _name': '',

        'public __construct': function( name )
        {
            this._name = name;
        },

        'public bark': function()
        {
            console.log( 'Woof!' );
        },

        'public getName': function()
        {
            return this._name;
        }
    });
````

The above creates an anonymous class and stores it in the variable ``Dog``. You
have the option of naming class in order to provide more useful error messages
and toString() output:

````javascript
    var Dog = Class( 'Dog',
    {
        // ...
    });
````

### Extending Classes
Classes may inherit from one-another. If the supertype was created using
`Class.extend()`, a convenience `extend()` method has been added to it. Classes
that were not created via `Class.extend()` can still be extended by passing it
as the first argument to `Class.extend()`.

Multiple inheritance is not supported. ease.js is very generous with the options
it provides to developers as alternatives, so pick whichever flavor your are
most comfortable with: interfaces, traits or mixins. Multiple inheritance will
*not* be added in the future due to problems which have been addressed by
interfaces and traits.

**Note that traits and mixins are not yet available. They are
planned features and will be available in the future.**

````javascript
    var SubFoo = Foo.extend(
    {
        'public anotherMethod': function()
        {
        },
    });

    // if Foo was not created via Class.extend(), this option may be used (has
    // the same effect as above, even if Foo was created using Class.extend())
    var SubFoo = Class.extend( Foo,
    {
        'public anotherMethod': function()
        {
        },
    });
````

### Abstract Classes
Abstract classes require that their subtypes implement certain methods. They
cannot be instantiated. Classes are considered to be abstract if they contain
one or more abstract methods and are declared using `AbstractClass` rather than
`Class`. If a class contains abstract methods but is not declared abstract, an
error will result. Similarily, if a class is declared to be abstract and
contains *no* abstract methods, an error will be thrown.

````javascript
    var AbstractClass = require( 'easejs' ).AbstractClass;

    var AbstractFoo = AbstractClass(
    {
        // a function may be provided if you wish the subtypes to implement a
        // certain number of arguments
        'abstract public fooBar': [ 'arg' ],

        // alternatively, you needn't supply implementation details
        'abstract public fooBar2': [],
    });
````

If the abstract method provides implementation details (as shown by
`fooBar()`, subtypes must implement at least that many arguments or an exception
will be thrown. This ensures consistency between supertypes and their subtypes.

Abstract classes can be extended from just as an other class. In order for its
subtype to be instantiated, it must provide concrete implementations of each
abstract method. If any methods are left as abstract, then the subtype too will
be considered abstract and must be declared as such.

````javascript
    // can be instantiated because concrete methods are supplied for both
    // abstract methods
    var ConcreteFoo = Class.extend( AbstractFoo,
    {
        'public fooBar': function( arg )
        {
        },

        'public fooBar2': function()
        {
        },
    });

    // cannot be instantiated because one abstract method remains
    var StillAbstractFoo = AbstractClass.extend( AbstractFoo,
    {
        'public fooBar': function( arg )
        {
        },
    });
````

### Interfaces
Interfaces can be declared in a very similar manner to classes. All members of
an interface are implicitly abstract.

````javascript
    var MyType = Interface(
    {
        'public foo': []
    });
````

To implement an interface, use the `implement()` class method:

````javascript
    var ConcreteType = Class.implement( MyType ).extend(
    {
        'public foo': function() {}
    });
````

Note that, if a concrete implementation for each method is not provided, the
implementing type must be declared abstract.

## License
ease.js is free software: you can redistribute it and/or modify it under the
terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU General Public License for more details.

**N.B.:** Versions prior to 0.2.0 were released under the LGPLv3+. Upon becoming
a GNU project, it was relicensed under the GPLv3+ to help the FSF stand strong
in its fight against proprietary JavaScript. For more information, please see
the NEWS file (which can be built with `make NEWS`).

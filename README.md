<!--
  Copyright (C) 2010, 2011, 2013, 2014 Free Software Foundation, Inc.

  This file is part of GNU ease.js.

  Copying and distribution of this file, with or without modification, are
  permitted in any medium without royalty provided the copyright notice and
  this notice are preserved.  This file is offered as-is, without warranty
  of any kind.
-->

# GNU ease.js

GNU ease.js is a classical object-oriented framework for Javascript,
intended to eliminate boilerplate code and "ease" the transition into
JavaScript from other object-oriented languages.

Current support includes:

* Simple and intuitive class definitions
* Classical inheritance
* Abstract classes and methods
* Interfaces
* Traits as mixins
* Visibility (public, protected, and private members)
* Static and constant members


## Documentation
Comprehensive documentation and examples are available on the [GNU
ease.js](https://www.gnu.org/software/easejs) website and in its
[manual](https://www.gnu.org/software/easejs/manual).


## Bug Reports / Feature Requests
Please direct bug reports and feature requests to bug-easejs@gnu.org or the
[project page on Savannah](https://savannah.gnu.org/projects/easejs).


## Why Classical OOP in JavaScript?
GNU ease.js was created (historically) for a number of reasons:

* To "ease" object-oriented developers into JavaScript by providing a
  familiar environment.
* To provide the maintenance and development benefits of classical OOP.
* To provide features not included in the language, such as proper
  encapsulation through private/protected members, interfaces, traits,
  intuitive inheritance, and other conveniences.
* To encapsulate the hacks commonly used to perform the above tasks.

Many JS purists believe that classical object-oriented programming should be
left out of JavaScript and that one should stick strictly to prototypal
development. While the two are related (they are both object-oriented), they
can be applied to different problem domains in order to achieve results that
are more natural or intuitive to developers; GNU ease.js works seamlessly
with existing prototypes, allowing the developer to choose whether or not
they want to use "classes".


## License
GNU ease.js is free software: you can redistribute it and/or modify it under the
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

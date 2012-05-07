var cow    = Cow(),
    sturdy = SturdyCow();

Class.isA( Cow, cow );           // true
Class.isA( SturdyCow, cow );     // false
Class.isA( Cow, sturdy );        // true
Class.isA( SturdyCow, sturdy );  // true

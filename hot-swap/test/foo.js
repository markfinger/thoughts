foo = function() {}

blah();

foo(function blah(){console.log(true)})

function blah(){console.log(false)}

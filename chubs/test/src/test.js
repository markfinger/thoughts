import foo from './foo';

var a = 10;

var b = function() {
  return a;
};

function c(d) {
  return d + a;
}

module.exports = {
  a: a,
  b: b,
  c: c
};
var hello = 'hello';
foo();
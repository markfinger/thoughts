var _start;
var start = function() {
  _start = +new Date();
};

var end = function() {
  console.log(+new Date() - _start);
  _start = null;
};

var i;
var count = 10000000;
var halfCount = count / 2;

start();
var a1 = [];
var a2 = function(foo, bar) {
  foo = foo + bar + foo * 20;
  a1.push(foo + bar);
};
for (i=0; i < count; i++) {
  a2('foo', 'bar');
}
end();

a1 = [];

start();
var b1 = [];
var b2 = function(foo, bar) {
  foo = foo + bar + foo * 20;
  b1.push(foo + bar);
};
var b3 = function() {
  b2.apply(this, arguments);
};
for (i=0; i < count; i++) {
  b3('foo', 'bar');
}
end();

b1 = [];

start();
var c1 = [];
var c2a = function(foo, bar) {
  foo = foo + bar + foo * 20;
  c1.push(foo + bar);
};
var c2b = function(foo, bar) {
  foo = foo + bar + foo * 20;
  c1.push(foo + bar);
};
var c3 = c2a;
var c4 = function() {
  c3.apply(this, arguments);
};
for (i=0; i < halfCount; i++) {
  c4('foo', 'bar');
}
c3 = c2b;
for (i=0; i < halfCount; i++) {
  c4('foo', 'bar');
}
end();

c1 = [];
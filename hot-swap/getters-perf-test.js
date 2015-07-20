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

start();
var a1 = {foo: 'bar'};
var a2 = 'wot';
var a3 = [];
for (i=0; i < count; i++) {
  a3.push(a1.foo + a2);
}
end();

start();
var b1 = {};
Object.defineProperty(b1, 'foo', {
  get: function() {
    return 'bar';
  }
});
var b2 = 'wot';
var b3 = [];
for (i=0; i < count; i++) {
  b3.push(b1.foo + b2);
}
end();

start();
var c1 = {};
var _foo = 'bar';
Object.defineProperty(c1, 'foo', {
  get: function() {
    return _foo;
  }
});
var c2 = 'wot';
var c3 = [];
for (i=0; i < count; i++) {
  c3.push(c1.foo + c2);
}
end();
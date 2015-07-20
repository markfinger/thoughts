given

```javascript

var a = require('a');
var b = require('b').b;

var c = 1;

var d = function() {
  return c;
};

var e = (function() {
  var c = 2;
  var f = 3;
  return function() {
    return c + f;
  };
})();

module.exports = {
  a: a,
  b: b,
  c: c,
  d: d,
  e: e
};
```

produce

```javascript
var __hmr__ = {};

__hmr__['a'] = require('a');
__hmr__['b'] = require('b').b;

__hmr__['c'] = 1;

__hmr__['d'] = function() {
  return __hmr__['c']
};

__hmr__['e'] = (function() {
  __hmr__['_c'] = 2;
  __hmr__['f'] = 3;
  return function() {
    return __hmr__['_c'] + __hmr__['f'];
  };
})();

// TODO: difficult without the overhead of a proxy or getter
module.exports = {
  c: __hmr__['c'],
  d: __hmr__['d'],
  e: __hmr__['e'],
};

module.hot.apply(function(data) {
  for (prop in data) {
    __hmr__[prop] = data[prop];
  }
});
```

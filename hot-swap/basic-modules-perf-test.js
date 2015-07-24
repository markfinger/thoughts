(function() {
  var _start;
  var start = function() {
    _start = +new Date();
  };

  var end = function() {
    console.log(+new Date() - _start);
    _start = null;
  };

  var i;
  var count = 1000000;

  start();
  var input = (function() {
    var a = 8;

    var b = {
      c: a
    };

    var d = function() {
      return b.c + a;
    };

    return function() {
      return d();
    };
  })();
  for (i=0; i < count; i++) {
    input();
  }
  end();

  start();
  var __hs = {};
  var output = (function() {
    __hs['a'] = 8;

    __hs['b'] = {};

    Object.defineProperty(__hs['b'], 'c', {
      get: function() {
        return __hs['a'];
      },
      set: function(value) {
        return __hs['a'] = value;
      },
      enumerable: true
    });

    __hs['d'] = function() {
      return __hs['b'].c + __hs['a'];
    };

    __hs['e'] = function() {
      return __hs['d']();
    };

    return function() {
      return __hs['e'].apply(this, arguments);
    };
  })();
  for (i=0; i < count; i++) {
    output();
  }
  end();
})();


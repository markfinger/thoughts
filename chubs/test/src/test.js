import foo from './foo';
var a = 10;

var host = window.document.location.host.replace(/:.*/, '');

var ws = new WebSocket('ws://' + host + ':' + window.location.port);

ws.onmessage = function(event) {
  console.log(JSON.parse(event.data));
};

var b = function() {
  return a + 1;
};

function c(d) {
  return d + a;
}

module.exports = {
  a: a,
  b: b,
  c: c
};
var hello = 'hello wha';
foo();
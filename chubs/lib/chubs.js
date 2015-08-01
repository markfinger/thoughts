'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _babelCore = require('babel-core');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var moduleId = 0;
var modules = Object.create(null);
var modulesByFilename = Object.create(null);

var resolveLog = (0, _logger2['default'])('resolve');
var depLog = (0, _logger2['default'])('dep');
var parseLog = (0, _logger2['default'])('parse');
var parseDepLog = (0, _logger2['default'])('parse-dep');
var moduleLog = (0, _logger2['default'])('module');
var buildLog = (0, _logger2['default'])('build');
var buildPerfLog = (0, _logger2['default'])('build-perf');

function getDep(filename, dep) {
  resolveLog('resolving dep "' + dep + '" from ' + filename);

  var depPath = _resolve2['default'].sync(dep, {
    basedir: _path2['default'].dirname(filename)
  });

  resolveLog('resolved dep "' + dep + '" to ' + depPath);

  return getModule(depPath);
}

function addDep(filename, name) {
  depLog('Adding dep "' + name + '" to ' + filename);

  var depModule = getDep(filename, name);

  var _module = getModule(filename);

  _module.dependencies.push({
    id: depModule.id,
    name: name,
    filename: depModule.filename
  });

  depLog('Added dep "' + depModule.filename + '" to ' + _module.filename);

  return depModule;
}

function getModule(filename) {
  moduleLog('request for module "' + filename + '"');

  if (!filename) {
    throw new Error('h');
  }

  var id = modulesByFilename[filename];

  if (id) {
    return modules[id];
  } else {
    id = (++moduleId).toString();
  }

  var _module = {
    id: id,
    filename: filename,
    dependencies: []
  };

  modules[id] = _module;
  modulesByFilename[filename] = id;

  moduleLog('created module ' + _module.id + ' for "' + filename + '"');

  return _module;
}

var depTransform = 'chubs-deps';

_babelCore.transform.pipeline.addTransformer(depTransform, {
  visitor: {
    CallExpression: {
      exit: function exit(node, parent, scope, path) {
        if (node.callee.name === 'require') {
          var dep = node.arguments[0];

          if (!_babelCore.types.isLiteral(dep)) {
            throw new Error('Dependency is not a literal: ' + JSON.stringify(dep));
          }

          var filename = path.opts.filename;

          parseDepLog('found dep "' + dep.value + '" in ' + filename);

          var depModule = addDep(filename, dep.value);

          parseDepLog('rewriting dep "' + dep.value + '" to "' + depModule.id + '"');

          dep.value = depModule.id + '';
        }
      }
    }
  }
});

function build(filename) {
  buildLog('building ' + filename);

  var buildStart = Date.now();

  var _module = getModule(filename);

  if (!_module.code) {
    buildLog('reading ' + filename);

    var whitelist = undefined;
    if (/node_modules/.test(filename)) {
      whitelist = [depTransform];
    }

    var contents = _fs2['default'].readFileSync(filename).toString();

    var parseStart = Date.now();
    var data = (0, _babelCore.transform)(contents, {
      filename: filename,
      whitelist: whitelist
      //sourceMaps: true,
      //sourceFileName: path.basename(filename),
      //sourceMapTarget: path.basename(filename) + '.map'
    });
    var parseEnd = Date.now();

    parseLog('Spent ' + (parseEnd - parseStart) + 'ms parsing ' + filename);

    _module.code = data.code;
  }

  var buildEnd = Date.now();
  buildPerfLog('Spent ' + (buildEnd - buildStart) + 'ms building ' + filename);

  if (_module.dependencies.length) {
    var buildDepsStart = Date.now();

    _module.dependencies.forEach(function (dep) {
      var depModule = getModule(dep.filename);

      if (!depModule.code) {
        buildLog('building dependency ' + depModule.filename);
        build(depModule.filename);
      }
    });

    var buildDepsEnd = Date.now();
    buildPerfLog('Spent ' + (buildDepsEnd - buildDepsStart) + 'ms building dependencies for ' + filename);
  }
}

function chubs(filename) {
  build(filename);

  var definitions = [];

  for (var id in modules) {
    var _module = modules[id];
    var commentDivider = _lodash2['default'].repeat('-', _module.filename.length);
    var definition = '\n__define(\'' + _module.id + '\', function(module, exports, require) {\n// start: ' + _module.filename + '\n// -------' + commentDivider + '\n\n\n' + _module.code + '\n\n\n// -----' + commentDivider + '\n// end: ' + _module.filename + '\n});';
    definitions.push(definition);
  }

  var entryModule = modulesByFilename[filename];

  var script = '\n(function() {\nvar __global = this;\nvar __modules = Object.create(null);\nvar __requireCache = Object.create(null);\n\nfunction __require(dep) {\n  if (__requireCache[dep] !== undefined) {\n    return __requireCache[dep];\n  }\n\n  var module = {exports: {}};\n\n  __requireCache[dep] = __modules[dep].call(__global, module, module.exports, __require);\n\n  return module.exports;\n};\n\nvar __define = function(id, _module) {\n  __modules[id] = _module;\n};\n\n' + definitions.join('\n\n') + '\n\n\n__require(\'' + entryModule + '\');\n\n})();\n  ';

  console.log(script);
}

module.exports = chubs;
//# sourceMappingURL=chubs.js.map
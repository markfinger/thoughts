'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _babelCore = require('babel-core');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _watchpack = require('watchpack');

var _watchpack2 = _interopRequireDefault(_watchpack);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var moduleId = 0;
var modules = Object.create(null);
var modulesByFilename = Object.create(null);

var wp = new _watchpack2['default']();

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

  return getModuleByFilename(depPath);
}

function addDep(filename, name) {
  var depModule = getDep(filename, name);
  var mod = getModuleByFilename(filename);

  if (!_lodash2['default'].contains(depModule.dependents, mod.id)) {
    depModule.dependents.push(mod.id);
  }

  if (!_lodash2['default'].contains(mod.dependencies, depModule.id)) {
    mod.dependencies.push(depModule.id);
  }

  depLog('Added dep "' + depModule.id + '" to ' + mod.id);

  return depModule;
}

function getModuleByFilename(filename) {
  moduleLog('request for module "' + filename + '"');

  var id = modulesByFilename[filename];

  if (id && modules[id]) {
    return modules[id];
  } else if (!id) {
    id = (++moduleId).toString();
  }

  var mod = {
    id: id,
    filename: filename,
    dependencies: [],
    dependents: []
  };

  modules[id] = mod;
  modulesByFilename[filename] = id;

  moduleLog('created module ' + mod.id + ' for "' + filename + '"');

  return mod;
}

function getModuleById(id) {
  return modules[id];
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

function build(mod) {
  var filename = mod.filename;

  buildLog('building ' + filename);

  var buildStart = Date.now();

  if (!mod.code) {
    buildLog('reading ' + filename);

    var whitelist = undefined;
    if (/nodemods/.test(filename)) {
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

    mod.code = data.code;
  }

  var buildEnd = Date.now();
  buildPerfLog('Spent ' + (buildEnd - buildStart) + 'ms building ' + filename);

  if (mod.dependencies.length) {
    var buildDepsStart = Date.now();

    mod.dependencies.forEach(function (id) {
      var depModule = getModuleById(id);
      build(depModule);
    });

    var buildDepsEnd = Date.now();
    buildPerfLog('Spent ' + (buildDepsEnd - buildDepsStart) + 'ms building dependencies for ' + filename);
  }
}

function defineModule(mod) {
  var commentDivider = _lodash2['default'].repeat('-', mod.filename.length);

  return '\n// --------------------' + commentDivider + '\n// Module ' + mod.id + ' -> ' + mod.filename + '\n// --------------------' + commentDivider + '\n__define(\'' + mod.id + '\', function(module, exports, require) {\n' + mod.code + '\n});';
}

function defineModules(modules) {
  return _lodash2['default'].map(modules, defineModule);
}

function generateScript(modules, entry) {
  var entryModule = getModuleByFilename(entry);

  return '\n(function() {\n// Preserve a reference to the global\nvar __global = this;\n\n// A map of module ids to module functions\nvar __moduleDefinitions = Object.create(null);\n\n// A store of the cached output from the module definitions\nvar __requireCache = Object.create(null);\n\n// The `require` function used by the modules\nfunction __require(dep) {\n  if (__requireCache[dep] !== undefined) {\n    return __requireCache[dep];\n  }\n\n  var _module = {exports: {}};\n\n  var moduleDefinition = __moduleDefinitions[dep];\n\n  __requireCache[dep] = moduleDefinition.call(__global, _module, _module.exports, __require);\n\n  return module.exports;\n};\n\n// Populate the module definitions\nvar __define = function(id, func) {\n  __moduleDefinitions[id] = func;\n};\n\n' + defineModules(modules).join('\n\n') + '\n\n\n// Call ' + entryModule.filename + '\n__require(\'' + entryModule.id + '\');\n\n})();\n  ';
}

function watch(modules, startTime) {
  var filenames = (0, _lodash2['default'])(modules).values().pluck('filename').value();

  wp.watch(filenames, [], startTime);
}

function chubs(opts, cb) {
  var startTime = Date.now();

  var entry = opts.entry;
  if (!entry) {
    throw new Error('Entry option was not defined in ' + JSON.stringify(opts));
  }

  if (!_path2['default'].isAbsolute(entry)) {
    entry = _path2['default'].resolve(entry);
  }

  console.log('Entry: ' + entry);

  var mod = getModuleByFilename(entry);

  build(mod);

  watch(modules, startTime);

  wp.on('change', function (filename) {
    var mod = getModuleByFilename(filename);
    mod.code = undefined;
    build(mod);
    console.log('Rebuilt module ' + mod.id + ': ' + mod.filename);
  });

  cb({
    startTime: startTime,
    entry: entry,
    output: generateScript(modules, entry),
    modules: modules
  });
}

exports['default'] = chubs;
module.exports = exports['default'];
//# sourceMappingURL=chubs.js.map
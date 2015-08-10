'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _babelCore = require('babel-core');

var _resolve = require('resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _watchpack = require('watchpack');

var _watchpack2 = _interopRequireDefault(_watchpack);

var _ws = require('ws');

var _ws2 = _interopRequireDefault(_ws);

var _nodeLibsBrowser = require('node-libs-browser');

var _nodeLibsBrowser2 = _interopRequireDefault(_nodeLibsBrowser);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

var emptyMock = _resolve2['default'].sync('node-libs-browser/mock/empty');
var nodeLibs = _lodash2['default'].mapValues(_nodeLibsBrowser2['default'], function (filename, dep) {
  if (filename) {
    return filename;
  }

  try {
    return _resolve2['default'].sync('node-libs-browser/mock/' + dep);
  } catch (err) {
    return emptyMock;
  }
});

var entry = undefined;

var moduleId = 0;
var modules = Object.create(null);
var modulesByFilename = Object.create(null);

var wp = new _watchpack2['default']();

var app = (0, _express2['default'])();
var server = _http2['default'].Server(app);
var wss = new _ws2['default'].Server({ server: server });

var connections = [];

wss.on('connection', function (ws) {
  console.log('websocket connected');

  connections.push(ws);

  ws.on('close', function () {
    console.log('websocket closed');
    connections = _lodash2['default'].without(connections, ws);
  });
});

app.get('/', function (req, res) {
  var script = generateScript(modules, getModuleByFilename(entry));

  res.end('\n<html>\n<body>\n  <script>\n    ' + script + '\n  </script>\n</body>\n</html>\n  ');
});

server.listen(8000, function () {
  console.log('listening at http://127.0.0.1:8000');
});

var resolveLog = (0, _logger2['default'])('resolve');
var depLog = (0, _logger2['default'])('dep');
var parseLog = (0, _logger2['default'])('parse');
var parseDepLog = (0, _logger2['default'])('parse-dep');
var moduleLog = (0, _logger2['default'])('module');
var buildLog = (0, _logger2['default'])('build');
var buildPerfLog = (0, _logger2['default'])('build-perf');

function getDep(filename, dep) {
  resolveLog('resolving dep "' + dep + '" from ' + filename);

  var depPath = undefined;
  if (dep === 'inherits') {
    depPath = _resolve2['default'].sync('./hacks/inherits_browser.js');
  } else if (dep in nodeLibs) {
    depPath = nodeLibs[dep];
  } else {
    depPath = _resolve2['default'].sync(dep, {
      basedir: _path2['default'].dirname(filename)
    });
  }

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
    //Program: {
    //  exit(node, parent, scope, context) {
    //    if (context.__mockProcess) {
    //      debugger
    //    }
    //  }
    //},
    //ExpressionStatement: {
    //  exit(node, parent, scope, context) {
    //    if (types.isIdentifier(node.object) && node.object.name === 'process') {
    //      context.__mockProcess = true;
    //    }
    //  }
    //},
    CallExpression: {
      exit: function exit(node, parent, scope, context) {
        var name = node.callee.name;

        if (name === 'require') {
          if (node.arguments.length != 1) {
            throw new Error('Can only process requires with one arg: ' + JSON.stringify(node));
          }

          var dep = node.arguments[0];
          var filename = context.opts.filename;

          var depModule = undefined;

          // TODO: non-hacky way to avoid dynamic requires
          if (!_babelCore.types.isLiteral(dep)) {
            depModule = getModuleByFilename(emptyMock);
            node.arguments = [_babelCore.types.literal(JSON.stringify(depModule.id))];
            return;
          }

          parseDepLog('found dep "' + dep.value + '" in ' + filename);
          depModule = addDep(filename, dep.value);

          parseDepLog('rewriting dep "' + dep.value + '" to "' + depModule.id + '"');
          dep.value = depModule.id + '';
        }
      }
    }
  }
});

function build(mod) {
  var filename = mod.filename;

  if (!mod.code) {
    buildLog('building ' + filename);

    var buildStart = Date.now();

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

    mod.code = data.code;

    var buildEnd = Date.now();
    buildPerfLog('Spent ' + (buildEnd - buildStart) + 'ms building ' + filename);
  }

  if (mod.dependencies.length) {
    var buildDepsStart = Date.now();

    mod.dependencies.forEach(function (id) {
      var depModule = getModuleById(id);
      if (!depModule.code) {
        build(depModule);
      }
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

function generateScript(modules, entryModule) {
  return '\n(function(__global) {\n// TODO: remove this\nwindow.require = __require;\n\n// Mock the process global\nvar process = {env: {}};\n\n// A map of module ids to module functions\nvar __moduleDefinitions = Object.create(null);\n\n// A store of the cached output from the module definitions\nvar __requireCache = Object.create(null);\n\n// The `require` function used by the modules\nfunction __require(dep) {\n  if (__requireCache[dep] !== undefined) {\n    return __requireCache[dep];\n  }\n\n  var moduleDefinition = __moduleDefinitions[dep];\n  if (moduleDefinition === undefined) {\n    throw new Error(\'Module "\' + dep + \'" has no definition\');\n  }\n\n  var _module = {exports: {}};\n\n  // Prepopulate the require cache early to avoid circular dependencies\n  __requireCache[dep] = {};\n\n  moduleDefinition.call(__global, _module, _module.exports, __require);\n\n  __requireCache[dep] = _module.exports;\n\n  return _module.exports;\n};\n\n// Populates the module definitions\nfunction __define(id, func) {\n  __moduleDefinitions[id] = func;\n};\n\n' + defineModules(modules).join('\n\n') + '\n\n\n// Call ' + entryModule.filename + '\n__require(\'' + entryModule.id + '\');\n\n})(this);\n  ';
}

function watch(modules, startTime) {
  var filenames = (0, _lodash2['default'])(modules).values().pluck('filename').value();

  wp.watch(filenames, [], startTime);
}

function chubs(opts, cb) {
  var startTime = Date.now();

  entry = opts.entry;
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
    console.log('Rebuilt module \'' + mod.id + '\' => ' + mod.filename);
    connections.forEach(function (ws) {
      return ws.send(JSON.stringify(mod));
    });
  });

  //cb({
  //  startTime,
  //  entry,
  //  output: generateScript(modules, entry),
  //  modules
  //});
}

exports['default'] = chubs;
module.exports = exports['default'];
//# sourceMappingURL=chubs.js.map
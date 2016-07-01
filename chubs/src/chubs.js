import path from 'path';
import fs from 'fs';
import http from 'http';
import express from 'express';
import {transform, types} from 'babel-core';
import resolve from 'resolve';
import _ from 'lodash';
import Watchpack from 'watchpack';
import ws from 'ws';
import nodeLibsBrowser from 'node-libs-browser';
import logger from './logger';

const emptyMock = resolve.sync(`node-libs-browser/mock/empty`);
const nodeLibs = _.mapValues(nodeLibsBrowser, (filename, dep) => {
  if (filename) {
    return filename;
  }

  try {
    return resolve.sync(`node-libs-browser/mock/${dep}`);
  } catch(err) {
    return emptyMock;
  }
});

let entry;

let moduleId = 0;
const modules = Object.create(null);
const modulesByFilename = Object.create(null);

const wp = new Watchpack();

const app = express();
const server = http.Server(app);
const wss = new ws.Server({server});

let connections = [];

wss.on('connection', function(ws) {
  console.log('websocket connected');

  connections.push(ws);

  ws.on('close', function() {
    console.log('websocket closed');
    connections = _.without(connections, ws);
  });
});

app.get('/', function(req, res) {
  const script = generateScript(modules, getModuleByFilename(entry));

  res.end(`
<html>
<body>
  <script>
    ${script}
  </script>
</body>
</html>
  `);
});

server.listen(8000, function() {
  console.log('listening at http://127.0.0.1:8000');
});

const resolveLog = logger('resolve');
const depLog = logger('dep');
const parseLog = logger('parse');
const parseDepLog = logger('parse-dep');
const moduleLog = logger('module');
const buildLog = logger('build');
const buildPerfLog = logger('build-perf');

function getDep(filename, dep) {
  resolveLog(`resolving dep "${dep}" from ${filename}`);

  let depPath;
  if (dep === 'inherits') {
    depPath = resolve.sync('./hacks/inherits_browser.js');
  } else if (dep in nodeLibs) {
    depPath = nodeLibs[dep];
  } else {
    depPath = resolve.sync(dep, {
      basedir: path.dirname(filename)
    });
  }

  resolveLog(`resolved dep "${dep}" to ${depPath}`);

  return getModuleByFilename(depPath);
}

function addDep(filename, name) {
  let depModule = getDep(filename, name);
  let mod = getModuleByFilename(filename);

  if (!_.contains(depModule.dependents, mod.id)) {
    depModule.dependents.push(mod.id);
  }

  if (!_.contains(mod.dependencies, depModule.id)) {
    mod.dependencies.push(depModule.id);
  }

  depLog(`Added dep "${depModule.id}" to ${mod.id}`);

  return depModule;
}

function getModuleByFilename(filename) {
  moduleLog(`request for module "${filename}"`);

  let id = modulesByFilename[filename];

  if (id && modules[id]) {
    return modules[id];
  } else if (!id) {
    id = (++moduleId).toString();
  }

  const mod = {
    id: id,
    filename: filename,
    dependencies: [],
    dependents: []
  };

  modules[id] = mod;
  modulesByFilename[filename] = id;

  moduleLog(`created module ${mod.id} for "${filename}"`);

  return mod;
}

function getModuleById(id) {
  return modules[id];
}

let depTransform = 'chubs-deps';

transform.pipeline.addTransformer(
  depTransform,
  {
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
        exit(node, parent, scope, context) {
          const name = node.callee.name;

          debugger

          if (name === 'require') {
            if (node.arguments.length != 1) {
              throw new Error(`Can only process requires with one arg: ${JSON.stringify(node)}`);
            }

            const dep = node.arguments[0];
            const filename = context.opts.filename;

            let depModule;

            // TODO: non-hacky way to avoid dynamic requires
            if (!types.isLiteral(dep)) {
              depModule = getModuleByFilename(emptyMock);
              node.arguments = [types.literal(JSON.stringify(depModule.id))];
              return;
            }

            parseDepLog(`found dep "${dep.value}" in ${filename}`);
            depModule = addDep(filename, dep.value);

            parseDepLog(`rewriting dep "${dep.value}" to "${depModule.id}"`);
            dep.value = depModule.id + '';
          }
        }
      }
    }
  }
);

function build(mod) {
  const filename = mod.filename;

  if (!mod.code) {
    buildLog(`building ${filename}`);

    const buildStart = Date.now();

    buildLog(`reading ${filename}`);

    let whitelist;
    if (/node_modules/.test(filename)) {
      whitelist = [depTransform];
    }

    const contents = fs.readFileSync(filename).toString();

    const parseStart = Date.now();
    const data = transform(contents, {
      filename: filename,
      whitelist: whitelist
      //sourceMaps: true,
      //sourceFileName: path.basename(filename),
      //sourceMapTarget: path.basename(filename) + '.map'
    });
    const parseEnd = Date.now();

    parseLog(`Spent ${parseEnd - parseStart}ms parsing ${filename}`);

    mod.code = data.code;

    const buildEnd = Date.now();
    buildPerfLog(`Spent ${buildEnd - buildStart}ms building ${filename}`);
  }

  if (mod.dependencies.length) {
    const buildDepsStart = Date.now();

    mod.dependencies.forEach((id) => {
      let depModule = getModuleById(id);
      if (!depModule.code) {
        build(depModule);
      }
    });

    const buildDepsEnd = Date.now();
    buildPerfLog(`Spent ${buildDepsEnd - buildDepsStart}ms building dependencies for ${filename}`);
  }
}

function defineModule(mod) {
  const commentDivider = _.repeat('-', mod.filename.length);

  return `
// --------------------${commentDivider}
// Module ${mod.id} -> ${mod.filename}
// --------------------${commentDivider}
__define('${mod.id}', function(module, exports, require) {
${mod.code}
});`;
}

function defineModules(modules) {
  return _.map(modules, defineModule);
}

function generateScript(modules, entryModule) {
  return `
(function(__global) {
// TODO: remove this
window.require = __require;

// Mock the process global
var process = {env: {}};

// A map of module ids to module functions
var __moduleDefinitions = Object.create(null);

// A store of the cached output from the module definitions
var __requireCache = Object.create(null);

// The \`require\` function used by the modules
function __require(dep) {
  if (__requireCache[dep] !== undefined) {
    return __requireCache[dep];
  }

  var moduleDefinition = __moduleDefinitions[dep];
  if (moduleDefinition === undefined) {
    throw new Error('Module "' + dep + '" has no definition');
  }

  var _module = {exports: {}};

  // Prepopulate the require cache early to avoid circular dependencies
  __requireCache[dep] = {};

  moduleDefinition.call(__global, _module, _module.exports, __require);

  __requireCache[dep] = _module.exports;

  return _module.exports;
};

// Populates the module definitions
function __define(id, func) {
  __moduleDefinitions[id] = func;
};

${defineModules(modules).join('\n\n')}


// Call ${entryModule.filename}
__require('${entryModule.id}');

})(this);
  `;
}

function watch(modules, startTime) {
  const filenames = _(modules).values().pluck('filename').value();

  wp.watch(filenames, [], startTime);
}

function chubs(opts, cb) {
  const startTime = Date.now();

  entry = opts.entry;
  if (!entry) {
    throw new Error(`Entry option was not defined in ${JSON.stringify(opts)}`);
  }

  if (!path.isAbsolute(entry)) {
    entry = path.resolve(entry);
  }

  console.log(`Entry: ${entry}`);

  let mod = getModuleByFilename(entry);

  build(mod);

  watch(modules, startTime);

  wp.on('change', function(filename) {
    const mod = getModuleByFilename(filename);
    mod.code = undefined;
    build(mod);
    console.log(`Rebuilt module '${mod.id}' => ${mod.filename}`);
    connections.forEach(ws => ws.send(JSON.stringify(mod)));
  });

  //cb({
  //  startTime,
  //  entry,
  //  output: generateScript(modules, entry),
  //  modules
  //});
}

export default chubs;
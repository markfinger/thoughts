import path from 'path';
import {transform, types} from 'babel-core';
import fs from 'fs';
import resolve from 'resolve';
import logger from './logger';
import _ from 'lodash';

let moduleId = 0;
let modules = Object.create(null);
let modulesByFilename = Object.create(null);

const resolveLog = logger('resolve');
const depLog = logger('dep');
const parseLog = logger('parse');
const parseDepLog = logger('parse-dep');
const moduleLog = logger('module');
const buildLog = logger('build');
const buildPerfLog = logger('build-perf');

function getDep(filename, dep) {
  resolveLog(`resolving dep "${dep}" from ${filename}`);

  let depPath = resolve.sync(dep, {
    basedir: path.dirname(filename)
  });

  resolveLog(`resolved dep "${dep}" to ${depPath}`);

  return getModule(depPath);
}

function addDep(filename, name) {
  depLog(`Adding dep "${name}" to ${filename}`);

  let depModule = getDep(filename, name);

  let _module = getModule(filename);

  _module.dependencies.push({
    id: depModule.id,
    name: name,
    filename: depModule.filename
  });

  depLog(`Added dep "${depModule.filename}" to ${_module.filename}`);

  return depModule;
}

function getModule(filename) {
  moduleLog(`request for module "${filename}"`);

  if (!filename) {
    throw new Error('h')
  }

  let id = modulesByFilename[filename];

  if (id) {
    return modules[id];
  } else {
    id = (++moduleId).toString();
  }

  const _module = {
    id: id,
    filename: filename,
    dependencies: []
  };

  modules[id] = _module;
  modulesByFilename[filename] = id;

  moduleLog(`created module ${_module.id} for "${filename}"`);

  return _module;
}

let depTransform = 'chubs-deps';

transform.pipeline.addTransformer(
  depTransform,
  {
    visitor: {
      CallExpression: {
        exit(node, parent, scope, path) {
          if (node.callee.name === 'require') {
            const dep = node.arguments[0];

            if (!types.isLiteral(dep)) {
              throw new Error('Dependency is not a literal: ' + JSON.stringify(dep))
            }

            const filename = path.opts.filename;

            parseDepLog(`found dep "${dep.value}" in ${filename}`);

            const depModule = addDep(filename, dep.value);

            parseDepLog(`rewriting dep "${dep.value}" to "${depModule.id}"`);

            dep.value = depModule.id + '';
          }
        }
      }
    }
  }
);

function build(filename) {
  buildLog(`building ${filename}`);

  const buildStart = Date.now();

  const _module = getModule(filename);

  if (!_module.code) {
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

    _module.code = data.code;
  }

  const buildEnd = Date.now();
  buildPerfLog(`Spent ${buildEnd - buildStart}ms building ${filename}`);

  if (_module.dependencies.length) {
    const buildDepsStart = Date.now();

    _module.dependencies.forEach(function(dep) {
      let depModule = getModule(dep.filename);

      if (!depModule.code) {
        buildLog(`building dependency ${depModule.filename}`);
        build(depModule.filename);
      }
    });

    const buildDepsEnd = Date.now();
    buildPerfLog(`Spent ${buildDepsEnd - buildDepsStart}ms building dependencies for ${filename}`);
  }
}

function chubs(filename) {
  build(filename);

  let definitions = [];

  for (var id in modules) {
    const _module = modules[id];
    const commentDivider = _.repeat('-', _module.filename.length);
    const definition = `
__define('${_module.id}', function(module, exports, require) {
// start: ${_module.filename}
// -------${commentDivider}


${_module.code}


// -----${commentDivider}
// end: ${_module.filename}
});`;
    definitions.push(definition);
  }

  const entryModule = modulesByFilename[filename];

  const script = `
(function() {
var __global = this;
var __modules = Object.create(null);
var __requireCache = Object.create(null);

function __require(dep) {
  if (__requireCache[dep] !== undefined) {
    return __requireCache[dep];
  }

  var module = {exports: {}};

  __requireCache[dep] = __modules[dep].call(__global, module, module.exports, __require);

  return module.exports;
};

var __define = function(id, _module) {
  __modules[id] = _module;
};

${definitions.join('\n\n')}


__require('${entryModule}');

})();
  `;

  console.log(script)
}

module.exports = chubs;
import path from 'path';
import {transform, types} from 'babel-core';
import fs from 'fs';
import resolve from 'resolve';
import _ from 'lodash';
import Watchpack from 'watchpack';
import logger from './logger';

let moduleId = 0;
let modules = Object.create(null);
let modulesByFilename = Object.create(null);

const wp = new Watchpack();

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

function build(mod) {
  const filename = mod.filename;

  buildLog(`building ${filename}`);

  const buildStart = Date.now();

  if (!mod.code) {
    buildLog(`reading ${filename}`);

    let whitelist;
    if (/nodemods/.test(filename)) {
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
  }

  const buildEnd = Date.now();
  buildPerfLog(`Spent ${buildEnd - buildStart}ms building ${filename}`);

  if (mod.dependencies.length) {
    const buildDepsStart = Date.now();

    mod.dependencies.forEach((id) => {
      let depModule = getModuleById(id);
      build(depModule);
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

function generateScript(modules, entry) {
  const entryModule = getModuleByFilename(entry);

  return `
(function() {
// Preserve a reference to the global
var __global = this;

// A map of module ids to module functions
var __moduleDefinitions = Object.create(null);

// A store of the cached output from the module definitions
var __requireCache = Object.create(null);

// The \`require\` function used by the modules
function __require(dep) {
  if (__requireCache[dep] !== undefined) {
    return __requireCache[dep];
  }

  var _module = {exports: {}};

  var moduleDefinition = __moduleDefinitions[dep];

  __requireCache[dep] = moduleDefinition.call(__global, _module, _module.exports, __require);

  return module.exports;
};

// Populate the module definitions
var __define = function(id, func) {
  __moduleDefinitions[id] = func;
};

${defineModules(modules).join('\n\n')}


// Call ${entryModule.filename}
__require('${entryModule.id}');

})();
  `;
}

function watch(modules, startTime) {
  const filenames = _(modules).values().pluck('filename').value();

  wp.watch(filenames, [], startTime);
}

function chubs(opts, cb) {
  const startTime = Date.now();

  let entry = opts.entry;
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
    console.log(`Rebuilt module ${mod.id}: ${mod.filename}`);
  });

  cb({
    startTime,
    entry,
    output: generateScript(modules, entry),
    modules
  });
}

export default chubs;
```js
function resolveDependencies(context) {
  const {pipeline, record} = context;

  const resolvedDependencies = {};
  const pendingDependencyResolutions = record.dependencies
    .map(dep => {
      return pipeline.resolveDependency({
        identifier: dep.identifier,
        record
      })
        .then(resolvedPath => {
          resolvedDependencies[dep.alias] = resolvedPath
        });
    });
  return Promise.all(pendingDependencyResolutions)
    .then(() => resolvedDependencies);
}
```

file types:

- 1-1: record-to-file
- 1-many: record to many files
- many-1: multiple records from a file

a single compilation process may produce:
- 1 asset
- 1 asset, with relationships to other assets
- relationships between other assets
- multiple assets
- multiple assets, each with relationships to each other and other assets

assets need to be able to declare:
- file dependencies
- the type and details of relationships to other assets

-------------------------

hypothesizing a declarative output for a build system
[
  {
    type: 'asset',
    assetType: 'js',
    path: '/path/foo.js',
    code: '...',
    sourceMap: '...',
    dependencyIdentifiers: {
      '0': './bar.css'
    },
    resolvedDependencies: {
      './foo.js': '/path/to/foo.js'
    }
  },
  {
    type: 'asset',
    assetType: 'css',
    code: '...',
    sourceMap: '...'
  },
  {
    type: 'relationship',
    dependent: '/some/file'
    dependency: '/some/other/file'
  }
]

```js

function blah(context) {
  const {pipeline, graph} = context;
  let {record} = context;

  return {
    record,
    dependencies: [

    ],
    subRecords: []
  };


  // return resolveDependencies(context)
  //   .then(resolvedDependencies => {
  //     record = record.set('resolvedDependencies', resolvedDependencies);
  //
  //     return _.forEach(record.resolvedDependencies, path => {
  //       const depRecord = graph.getRecordForFile(path);
  //       graph.addDependency(record.id)
  //
  //       if (path.endsWith('.css')) {
  //         const cssModulesRecord = cssModules()
  //       }
  //     });
  //   });
}


function graphInterface(graph, record) {
  return pipeline.readText(path)
    .then(text => {
      record = record.set('text', text);
      return babelProcessor(pipeline, record)
        .then(record => {
          return Promise.all(
            record.dependencies.map(dep => graph.enter(dep))
          );
        });
    });
}


const graph = createGraph({
  resolver
});

graph.addEntry('/foo/bar.js');

graph.on('complete', state => {

});

```
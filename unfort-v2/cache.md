by detecting calls to the pipeline and accesses to other records
we can detect an implicit connection between the file-system and
compiled assets. In effect, we no longer require explicit key
caches as we can compute them with more accuracy.

Eg: when resolving a path, we can detect all the "is file",
"read file" calls such that we can infer when to invalidate
something

if a change occurs to a file used to generate one or more assets,
we can then invalidate them. by extension, if we invalidate an
asset, any other assets that we dependent on the content of that
asset will also be invalid.

in effect, we detect the actions required to create an asset,
and can infer conditions when that asset is no longer valid.

seems complicated, but interesting. definitely worth considering,
if only for the novelty.

---------------------------------

Assuming a simple text file compiler that simply reads files in

```js
pipeline.readText = (path, {pipeline, graph}) => {
  const startTime = Date.now();
  return pipeline.fsCache.readFile(path)
    .then(text => {
      const dependency = {
        type: 'file read dependency',
        path,
        startTime,
        endTime: Date.now();
      };
      graph.addFileDependency(dependency);
      return text;
    });
}

function compiler({pipeline, graph, entryPoint}) {
  return pipeline.readText(entryPoint)
    .then(text => {
      const code = `
        module.exports = ${JSON.stringify(text)};
        if (module.hot) {
          module.hot.accept();
        }
      `;
      const asset = graph.createAsset({
        type: 'text',
        path: entryPoint,
        code,
        url: '/' + entryPoint
      });
      const dep = graph.compile('/some/other/file');
      graph.addDependency({
        from: asset,
        to: dep
      });
      graph.assetComplete(asset);
    });
});
```

The outcome would be

```js
[
  {
    type: 'create asset',
    id: 1,
    code: '...'
  },
  {
    type: 'file system dependency',
    action: 'read',
    path: '/path/to/file',
    start: 1234,
    end: 1234
  },
  {
    type: 'asset dependency',
    from: 1,
    to: 2
  }q
]
```

------------------------------------

The above would be analogous to creating an list of actions
that can be computed to create a file.

Eg:

```js
[
  'read file',
  'transform',
  'analyze'
]
```
```js
record = {
  id: '...',
  path: '...',
  text: '...',
  js: '...',
  jsSourceMap: {},
  jsDependencies: {},
  css: '...',
  cssSourceMap: {},
  cssDependencies: {},
  cacheKey: '',
  fileDependencies: []
}
```

Supporting multiple types on a record allows for interfaces to css like css modules.
It also allows for JS interfaces (eg: urls to assets) to be declared within the pipeline.

How to handle cache keys generated from multiple dependencies?
Might need to reverse the caching mechanism, so the key is the entry file and an
(optional?) job.
The data would contain what was generated as well as:
  - the env hash
  - each file dependency and it's mtime (maybe content hash as well?) at the time of compilation
the properties provided would then be compared to the current state before deciding whether it was still valid

import debug from 'debug';

const namespace = 'chubs';

function log(name) {
  return debug(`${namespace}:${name}`);
}

export default log;
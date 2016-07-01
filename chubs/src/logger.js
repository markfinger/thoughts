import debug from 'debug';

const namespace = 'chubs';

export default function logger(name) {
  return debug(`${namespace}:${name}`);
}
import debugContext from 'debug';
const debug = debugContext('analyzer');

import { readServerObject } from "../helpers.mjs";

export default {
  getSchema,
  readServerObject,
};

async function getSchema(so) {
  const schema = { format: so.format, keys: [], data: {}, count: 0 };
  Object.keys(so)
    .filter((i) => (typeof so[i] === "string")||typeof so[i] === "boolean")
    .map((i) => (schema[i] = so[i]));
  schema.count = so.data.length;
  for (let key of Object.keys(so)) {
    schema.keys.push(key);
  }
  for (let file of so.data) {
    for (let key of Object.keys(file)) {
      if (!schema.data[key]) schema.data[key] = 0;
      schema.data[key]++;
    }
  }
  return schema;
}

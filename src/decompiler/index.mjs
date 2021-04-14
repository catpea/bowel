import debugContext from 'debug';
const debug = debugContext('decompiler');

import { readServerObject } from "../helpers.mjs";

import v1 from './v1/index.mjs';
import v2 from './v2/index.mjs';

export default {
  v1,
  v2,
  readServerObject,
};

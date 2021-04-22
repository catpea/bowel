#!/usr/bin/env -S node --experimental-modules

import assert from 'assert';
import debugContext from 'debug';
const debug = debugContext('system');

import mirror from './module.mjs';

mirror({
  address: 'http://black:7467/',
  destination:'dest'
});

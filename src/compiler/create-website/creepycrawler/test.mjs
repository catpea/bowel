#!/usr/bin/env -S node --experimental-modules

import debugContext from 'debug';
const debug = debugContext('system');

import mirror from './module.mjs';

mirror('http://127.0.0.1:8080/index.html', 'test1', {})

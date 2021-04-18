#!/usr/bin/env -S node --experimental-modules

import assert from 'assert';
import debugContext from 'debug';
const debug = debugContext('system');

import {mirror, normalizeAddress} from './module.mjs';

assert.equal(normalizeAddress('http://127.0.0.1:8080'), 'http://127.0.0.1:8080/index.html');
assert.equal(normalizeAddress('http://127.0.0.1:8080/'), 'http://127.0.0.1:8080/index.html');
assert.equal(normalizeAddress('http://127.0.0.1:8080/index.html'), 'http://127.0.0.1:8080/index.html');
assert.equal(normalizeAddress('http://127.0.0.1:8080/index.html?alice=1&bob=2'), 'http://127.0.0.1:8080/index.html?alice=1&bob=2');
assert.equal(normalizeAddress('http://black:8080/image'), 'http://black:8080/image/index.html');
assert.equal(normalizeAddress('http://black:8080/image/'), 'http://black:8080/image/index.html');
assert.equal(normalizeAddress('http://black:8080/image/md-poetry-0412-illustration.jpg'), 'http://black:8080/image/md-poetry-0412-illustration.jpg');
assert.equal(normalizeAddress('http://black:8080/audio/poetry-0412.mp3'), 'http://black:8080/audio/poetry-0412.mp3');

// mirror('http://127.0.0.1:8080', 'dest');
// mirror('http://127.0.0.1:8080/', 'dest');
// mirror('http://127.0.0.1:8080/index.html', 'dest');
// mirror('http://127.0.0.1:8080/index.html?alice=1&bob=2', 'dest');
// mirror('http://black:8080/image', 'dest');
// mirror('http://black:8080/image/', 'dest');
// mirror('http://black:8080/image/md-poetry-0412-illustration.jpg', 'dest');
// mirror('http://black:8080/audio/poetry-0412.mp3', 'dest');

mirror('http://black:7467/', 'dest');

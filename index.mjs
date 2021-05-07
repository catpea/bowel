#!/usr/bin/env -S node --experimental-modules

import debugContext from 'debug';
const debug = debugContext('system');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

import { Command } from 'commander/esm.mjs';

import path from "path";
import util from 'util';
import child_process from 'child_process';
const execFile = util.promisify(child_process.execFile);

import dumper from './src/dumper/index.mjs';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const program = new Command();
program.version('3.0.0');

program.command('dump <file>')
  .description('Decompile a JSON server-object file and dump content into a well formed directory structure.')
  .option('--root-dir <dir>', 'Path to root of repository.')
  .option('--dist-dir <dir>', 'Path to dist directory.')
  .option('--web-dir <dir>', 'Root of local things linked in html (web root).')
  .option('--audio-dir <dir>', 'Path to audio files.')
  .option('--image-dir <dir>', 'Path to images.')
  .option('--yaml-db <dir>', 'Path to YAML database directory.')
  .action(async (file, options) => {
    const {rootDir, distDir, webDir, audioDir, imageDir, yamlDb } = options;
    await dump({target:file, rootDir, distDir, webDir, audioDir, imageDir, yamlDb});
  });

program.parse(process.argv);

async function dump({target, rootDir, distDir, webDir, audioDir, imageDir, yamlDb}){
  const so = await dumper.readServerObject(target);
  try{
    if( !rootDir ) {throw new Error('ERROR: --root-dir is unspecified: please specify the root directory so that general dependencies can be copied.');}
    if( !distDir ) {throw new Error('ERROR: --dist-dir is unspecified: please specify the dist directory so that generated assets may be fully imported...');}
    if( so.localAssets && (!webDir) ) { throw new Error('ERROR: --web-dir is unspecified, it is required for copying web assets (local to the webserver) that linked in the texts/posts.');}
    if( so.contactSheet && (!webDir) ) { throw new Error('ERROR: --web-dir is unspecified, it is required for copying image files related to contact sheet (page image).');}
    if( so.audioVersion && (!audioDir) ) { throw new Error('ERROR: --audio-dir is unspecified, it is required to import audio files that go along with the data.');}
    if( so.coverImages && (!imageDir) ) { throw new Error('ERROR: --image-dir is unspecified, it is required to copy main images');}
    if( so.yamlDatabase && (!yamlDb) ) { throw new Error('ERROR: --yaml-db is unspecified, it is required to copy yaml formatted data that is then converted to cache/content.html');}
  }catch(e){
    console.log(e.message);
    process.exit(1);
  }
  await dumper[so.format||'v1'].createIndex({ so }); // now we know order, and book metadata
  await dumper[so.format||'v1'].createData({ so, yamlDb }); // now poems and their configuration has been stored
  await dumper[so.format||'v1'].importFiles({ so, rootDir, distDir, webDir, audioDir, imageDir }); // now assets have been imported.
}

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

import analyzer from './src/analyzer/index.mjs';
import decompiler from './src/decompiler/index.mjs';
import compiler from './src/compiler/index.mjs';

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

const program = new Command();
program.version('2.0.0');

program.command('analyze <file>')
  .description('Print statistics and other useful information.')
  .action(async (file) => {
    debug(`using the analyzer`);
    await analyze({target:file});
  });

program.command('decompile <file>')
  .description('Decompile a JSON server-object file.')
  .option('--root-dir <dir>', 'Path to root of repository.')
  .option('--dist-dir <dir>', 'Path to dist directory.')
  .option('--web-dir <dir>', 'Root of local things linked in html (web root).')
  .option('--audio-dir <dir>', 'Path to audio files.')
  .option('--image-dir <dir>', 'Path to images.')
  .option('--yaml-db <dir>', 'Path to YAML database directory.')
  .action(async (file, options) => {
    const {rootDir, distDir, webDir, audioDir, imageDir, yamlDb } = options;
    await decompile({target:file, rootDir, distDir, webDir, audioDir, imageDir, yamlDb});
  });

program.command('compile <directory>')
  .description('Compile directory tree into a JSON server-object file.')
  .action(async (directory) => {
    debug(`using the compiler`);
    await compile({target:directory});
  });

program.command('create <template> <destination>')
  .description('Create a new entry based on specified template.')
  .option('-n, --name <name>', 'Name of item to create')
  .action(async (template, destination, options) => {
    debug(`using the injector`);
    debug({name: options.name, template, destination});
    destination = path.resolve(destination);
    create({name: options.name, template, destination});
  });


program.parse(process.argv);

async function analyze({target}){
  const so = await analyzer.readServerObject(target);
  const schema = await analyzer.getSchema(so);
  console.log(schema);
}

async function decompile({target, rootDir, distDir, webDir, audioDir, imageDir, yamlDb}){
  const so = await decompiler.readServerObject(target);
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
  await decompiler[so.format||'v1'].createIndex(so); // now we know order, and book metadata
  await decompiler[so.format||'v1'].createData(so, yamlDb); // now poems and their configuration has been stored
  await decompiler[so.format||'v1'].importFiles(so, rootDir, distDir, webDir, audioDir, imageDir); // now assets have been imported.
}

async function compile({target}){
  const ix = await compiler.indexParse(target);
  await compiler.createDistribution(ix);
}

async function create({name, template, destination}){
  const command = path.join(__dirname, 'templates', template, 'index.mjs');

  let gah = [];
  if(name) gah = gah.concat(['--name', 'NAME',])
  gah = gah.concat(['--destination', 'DESTINATION'])

  const commandArguments = gah
  .map(i=>i==='NAME'?name:i)
  .map(i=>i==='DESTINATION'?destination:i);

  const { stdout } = await execFile(command, commandArguments);
  if(stdout.trim()) debug(stdout);
}

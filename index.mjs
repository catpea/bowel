#!/usr/bin/env -S node --experimental-modules

import debugContext from 'debug';
const debug = debugContext('system');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

import { Command } from 'commander/esm.mjs';

import analyzer from './src/analyzer/index.mjs';
import decompiler from './src/decompiler/index.mjs';
import compiler from './src/compiler/index.mjs';

const program = new Command();
program.version('2.0.0');

program
  .option('-a, --analyze <file>', 'Print statistics and other useful information.')
  .option('-d, --decompile <file>', 'Decompile a JSON server-object file.')
  .option('-c, --compile <directory>', 'Compile directory tree into a JSON server-object file.')

  .option('--dist-dir <dir>', 'Path to dist directory.')
  .option('--web-dir <dir>', 'Root of local things linked in html (web root).')
  .option('--audio-dir <dir>', 'Path to audio files.')
  .option('--image-dir <dir>', 'Path to images.')
  .option('--yaml-db <dir>', 'Path to YAML database directory.');

program.parse(process.argv);
const options = program.opts();
main(options);

async function main(options){

  if(0){

  } else if (options.analyze){
    debug(`using the analyzer`);
    await analyze({target:options.analyze});

  } else if (options.decompile){
    debug(`using the decompiler`);
    const {distDir, webDir, audioDir, imageDir, yamlDb } = options;
    await decompile({target:options.decompile, distDir, webDir, audioDir, imageDir, yamlDb});

  } else if (options.compile){
    debug(`using the compiler`);
    await compile({target:options.compile});

  } // end if

}

async function analyze({target}){

  const so = await analyzer.readServerObject(target);
  const schema = await analyzer.getSchema(so);
  console.log(schema);

}

async function decompile({target, distDir, webDir, audioDir, imageDir, yamlDb}){
  const so = await decompiler.readServerObject(target);

  try{
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
  await decompiler[so.format||'v1'].importFiles(so, distDir, webDir, audioDir, imageDir); // now assets have been imported.

}

async function compile({target}){
  const ix = await compiler.indexParse(target);
  await compiler.createDistribution(ix);
}

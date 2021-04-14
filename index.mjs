#!/usr/bin/env -S node --experimental-modules

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

import { Command } from 'commander/esm.mjs';
import api from './api.mjs';

const program = new Command();
program.version('2.0.0');

program
  .option('-w, --web-dir <dir>', 'Root of local things linked in html (web root).')
  .option('-a, --audio-dir <dir>', 'Path to audio files.')
  .option('-i, --image-dir <dir>', 'Path to images.')
  .option('-r, --release-dir <dir>', 'Path to dist directory.')

  .option('-d, --decompile <file>', 'Decompile a JSON server-object file.')
  .option('-s, --status <file>', 'print statistics and other useful information.')
  .option('-c, --compile <directory>', 'Compile directory tree into a JSON server-object file.')

main();

async function main(){
  program.parse(process.argv);
  const options = program.opts();
  if (options.info) info({target:options.info});
  if (options.decompile) decompiler({ releaseDir:options.releaseDir, webDir: options.webDir, audioDir: options.audioDir, imageDir: options.imageDir, target:options.decompile});
  if (options.compile) compiler({target:options.compile});
}


async function info({target}){
  const so = await api.jsonParse(target);
  const schema = await api.getSchema(so);
  console.clear();
  console.log(schema);
}

async function decompiler({target, releaseDir, webDir, audioDir, imageDir}){
  const so = await api.jsonParse(target);

  if( !releaseDir ) {console.warn('releaseDir: please specify the dist directory or generated assets may not be fully imported resulting in slow regeneraton...');}
  if( so.localAssets && (!webDir) ) { throw new Error('webDir is unspecified local web assets linked in text will not be imported');}
  if( so.audioVersion && (!audioDir) ) { throw new Error('audioDir is unspecified audio will not be imported');}
  if( so.coverImages && (!imageDir) ) { throw new Error('imageDir is unspecified image will not be imported');}
  await api.createIndex(so); // now we know order, and book metadata
  await api.createDirectories(so); // now poems and their configuration has been stored
  await api.importFiles(so, releaseDir, webDir, audioDir, imageDir); // now assets have been imported.

}

async function compiler({target}){
  const ix = await api.indexParse(target);
  await api.createDistribution(ix);


  // TODO: Convert Markdown output to p.section/stanza thing AND >>>>>>> Create the Bootstrap Variant
  // TODO: Create A Simple HTML Mittor (Use "Index Of" like design from apache.)

  // TODO: Audiobook Compiler, split things up by time, 8 hours serments perhaps.

}

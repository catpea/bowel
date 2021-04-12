#!/usr/bin/env -S node --experimental-modules

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
});

import { Command } from 'commander/esm.mjs';
import api from './api.mjs';

const program = new Command();
program.version('2.0.0');

program
  .option('-w, --web-dir <dir>', 'Root of local things linked in html (web root).')
  .option('-a, --audio-dir <dir>', 'Path to audio files.')
  .option('-i, --image-dir <dir>', 'Path to images.')

  .option('-d, --decompile <file>', 'Decompile a JSON server-object file.')
  .option('-s, --status <file>', 'print statistics and other useful information.')
  .option('-c, --compile <directory>', 'Compile directory tree into a JSON server-object file.')

async function main(){

  program.parse(process.argv);

  const options = program.opts();

  if (options.info) info({target:options.info});
  if (options.decompile) decompiler({

    webDir: options.webDir,
    audioDir: options.audioDir,
    imageDir: options.imageDir,

    target:options.decompile});
  if (options.compile) compiler({target:options.compile});

}

main();

async function info({target}){
  const so = await api.jsonParse(target);
  const schema = await api.getSchema(so);
  console.clear();
  console.log(schema);
}

async function decompiler({target, webDir, audioDir, imageDir}){
  if(!webDir) {console.warn('webDir is unspecified local web assets linked in text will not be imported');}
  if(!audioDir) {console.warn('audioDir is unspecified audio will not be imported');}
  if(!imageDir) {console.warn('imageDir is unspecified image will not be imported');}

  const so = await api.jsonParse(target);
  await api.createIndex(so);
  await api.createDirectories(so);
  await api.importFiles(so, webDir, audioDir, imageDir);
}

async function compiler({target}){
  //const so = await api.dirParse(target);
}

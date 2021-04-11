#!/usr/bin/env -S node --experimental-modules

import { Command } from 'commander/esm.mjs';
import api from './api.mjs';

const program = new Command();
program.version('2.0.0');

program
  .option('-d, --decompile <file>', 'Decompile a JSON server-object file.')
  .option('-i, --info <file>', 'print statistics and other useful information.')
  .option('-c, --compile <directory>', 'Compile directory tree into a JSON server-object file.')

async function main(){

  program.parse(process.argv);

  const options = program.opts();

  if (options.info) info({target:options.info});
  if (options.decompile) decompiler({target:options.decompile});
  if (options.compile) compiler({target:options.compile});

}

main();

async function info({target}){
  const data = await api.jsonParse(target);
  console.log(data);
}

async function decompiler({target}){
  // OBJECT DECOMPILER
  const data = await api.jsonParse(target);
  
}

async function compiler({target}){
  const data = await api.dirParse(target);
}

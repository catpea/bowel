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
  const so = await api.jsonParse(target);
  const schema = await api.getSchema(so);
  console.clear();
  console.log(schema);
}

async function decompiler({target}){
  const so = await api.jsonParse(target);
  await api.toDirs(so);
}

async function compiler({target}){
  //const so = await api.dirParse(target);
}

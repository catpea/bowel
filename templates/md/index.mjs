#!/usr/bin/env -S node --experimental-modules

import { Command } from 'commander/esm.mjs';
import kebabCase from 'lodash/kebabCase.js';
import startCase from 'lodash/startCase.js';
import last from 'lodash/last.js';
import padStart from 'lodash/padStart.js';

import path from "path";
import { existsSync } from "fs";
import { mkdir, readFile, writeFile, copyFile } from "fs/promises";

const program = new Command();
program.version('2.0.0');

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

program
  .option('-d, --destination <destination>', 'destination directory')
  // .option('-n, --name <name>', 'name of item to create')

program.parse(process.argv);
const options = program.opts();
if (!options.destination) throw new Error('You must specify a destination.');

main(options)
async function main(){

  const destination = options.destination;



  // if(options.name){
  //   id = kebabCase(options.name);
  //   name = startCase(options.name);
  // } else {
  //   const ix = JSON.parse((await readFile(path.join(destination, 'index.json'))).toString());
  //   const text = 'furkies-purrkies-poetry';
  //   let newNumber = padStart(ix.data.length+1, 4, 0);
  //   id = kebabCase(text + '-' + newNumber);
  //   name = startCase(id);
  // }

  const delimiter = '-';
  const prefix = 'furkies-purrkies';
  const postfix = 'poetry';

  const ix = JSON.parse((await readFile(path.join(destination, 'index.json'))).toString());
  const number = padStart(ix.data.length+1, 4, 0);

  const id = kebabCase([prefix, postfix, number].join(delimiter));
  const title = startCase([prefix, postfix, number].join(delimiter));
  const image = kebabCase([postfix, number, 'illustration'].join(delimiter)) + '.jpg';
  const artwork = 'https://example.com';
  const audio = kebabCase([postfix, number].join(delimiter)) + '.mp3';
  const date = (new Date()).toISOString();

  console.log(`creating "${title}" with id=${id} in ${destination}`);

  const configuration = { id, title, date, image, artwork, audio };

  const content = `
Line1 //
Line2

Line1 //
Line 2

---

Line1,
Line2

Line1,
Line2 [Link1]

[Link1]: https://example.com
`.trim();

  if(existsSync(path.join(destination, id))) throw new Error('Problem, the new directory appears to already exists, program crashed to prevent damage.');

  await mkdir(path.join(destination, id), { recursive: true });
  await mkdir(path.join(destination, id, 'files'), { recursive: true });
  await mkdir(path.join(destination, id, 'cache'), { recursive: true });

  await writeFile(path.join(destination, id, 'configuration.json'), JSON.stringify(configuration, null, '  '));
  await copyFile(path.join(destination, id, 'configuration.json'), path.join(destination, id, 'cache', 'configuration.json'));
  await writeFile(path.join(destination,id,  'content.md'), content);
  await copyFile(path.join(__dirname, 'samples', 'illustration.jpg'),path.join(destination, id, 'files', image));
  await copyFile(path.join(__dirname, 'samples', 'audio.mp3'),path.join(destination, id, 'files', audio));

  ix.data.push(id);
  await writeFile(path.join(destination, 'index.json'), JSON.stringify(ix, null, '  '));


}

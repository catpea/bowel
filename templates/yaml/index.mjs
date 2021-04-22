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
  .option('-n, --name <name>', 'name of item to create')

program.parse(process.argv);
const options = program.opts();
if (!options.destination) throw new Error('You must specify a destination.');

main(options)
async function main(){

  if( (!options.name) || (!options.name.trim()) ) throw new Error('You must specify a name');

  const destination = options.destination;

  const ix = JSON.parse((await readFile(path.join(destination, 'index.json'))).toString());

  const prefix = 'westland-warrior';
  const delimiter = '-';

  const id = kebabCase([prefix, options.name].join(delimiter));
  const title = startCase(options.name);
  const image = `warrior-${kebabCase(options.name)}-cover.jpg`;
  const artwork = null;
  const audio = null
  const date = (new Date()).toISOString();

  console.log(`creating "${title}" with id=${id} in ${destination}`);

  const configuration = { id, title, date, image, artwork, audio };

  const content = `
- type: youtube
  id: D7npse9n-Yw
  title: 'We are experiencing Technical Difficulties - Please Stand By'
- type: text
  title: "We are experiencing Technical Difficulties - Please Stand By"
  text: |-
    Line1
    Line2
    Line3
- type: quote
  author: Shakespeare
  text: |-
    To be or not to be,
    that is the question.
- type: image
  url: example-image.jpg
  title: Please Stand By - A Local Image Example
  `.trim();

  if(existsSync(path.join(destination, id))) throw new Error('Problem, the new directory appears to already exists, program crashed to prevent damage.');

  await mkdir(path.join(destination, id), { recursive: true });
  await mkdir(path.join(destination, id, 'files'), { recursive: true });
  await mkdir(path.join(destination, id, 'cache'), { recursive: true });

  await writeFile(path.join(destination, id, 'configuration.json'), JSON.stringify(configuration, null, '  '));
  await copyFile(path.join(destination, id, 'configuration.json'), path.join(destination, id, 'cache', 'configuration.json'));
  await writeFile(path.join(destination,id,  'content.yaml'), content);
  await copyFile(path.join(__dirname, 'samples', 'example-image.jpg'),path.join(destination, id, 'files', 'example-image.jpg'));

  ix.data.push(id);
  await writeFile(path.join(destination, 'index.json'), JSON.stringify(ix, null, '  '));


}

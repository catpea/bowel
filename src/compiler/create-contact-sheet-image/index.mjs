import debugContext from 'debug';
const debug = debugContext('create-contact-sheet-image');

import yaml from "js-yaml";

import path from "path";
import { statSync } from "fs";
import { readFile } from "fs/promises";

import util from 'util';
import child_process from 'child_process';
const execFile = util.promisify(child_process.execFile);

import { gatherImages } from "../../helpers.mjs";
import { shouldRecompile } from "../helpers.mjs";

export {
  createContactSheetImage
};


async function createContactSheetImage(dataDirectory, entry) {
  if(!entry.image) return; // sometimes things don't have an audio version

  const filesDirectory = path.join(dataDirectory, "files");
  const cacheDirectory = path.join(dataDirectory, "cache");

  const yamlContentFile = path.join(dataDirectory, "content.yaml");
  const database = yaml.load(await readFile(yamlContentFile));

  const destinationFile = path.join(cacheDirectory, entry.image);
  const sourceFiles = (await gatherImages(database)).map(i=>path.join(filesDirectory,i));

  if(sourceFiles.length === 0) return;

  const latestFile = sourceFiles.map(file=>({file, date: new Date(statSync(file).mtime)})).sort((a, b) => b.date - a.date).shift().file;
  if(await shouldRecompile(destinationFile, latestFile)){
    debug(`rebuilding cover image for: ${entry.id}`);

    let tile = 3;
    if(sourceFiles > 17) tile = 3;
    if(sourceFiles > 25) tile = 4;
    if(sourceFiles > 35) tile = 5;
    if(sourceFiles > 45) tile = 7;
    if(sourceFiles < 9) tile = 2;
    if(sourceFiles < 4) tile = 1;

    const command = 'montage';
    const commandArguments = [
      '-background',
      '#212529',
      'SOURCES',
      '-geometry',
      '320x230',
      '-tile',
      `TILE`,
      'DESTINATION'
     ]
    .map(i=>i==='TILE'?`${tile}x`:i)
    //.map(i=>i==='SOURCES'?sourceFiles.join(" "):i)
    .map(i=>i==='DESTINATION'?destinationFile:i);

    commandArguments.splice(commandArguments.indexOf('SOURCES'), 1, ...sourceFiles);
    const { stdout } = await execFile(command, commandArguments);
    if(stdout.trim()) debug(stdout);

   }
  return true;
}

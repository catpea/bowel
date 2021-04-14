import debugContext from 'debug';
const debug = debugContext('compiler-helpers');

import { existsSync, statSync } from "fs";
import { readFile, readdir } from "fs/promises";

export {
  readRecord,
  contentFile,
  shouldRecompile,
};

async function readRecord(target) {
  debug(`Reading record: ${target}`);
  const so = JSON.parse((await readFile(target)).toString());
  return so;
}

async function contentFile(directory) {
  let candidates = [];
  let response = undefined;
  const files = await readdir(directory);
  for await (const file of files) {
    if (file.startsWith("content.")) candidates.push(file);
  }
  response = candidates.pop();
  return response;
}

async function shouldRecompile(destinationFile, sourceFile) {
  if (!existsSync(destinationFile)){
    console.log(`Outdated file, file does not exist ${destinationFile}`);
    return true; // yes it is outdated, it does not even exit
  }
  const destinationStats = statSync(destinationFile);
  const sourceStats = statSync(sourceFile);
  const destinationDate = new Date(destinationStats.mtime);
  const sourceDate = new Date(sourceStats.mtime);
  //if (destinationDate <= sourceDate)
  if (sourceDate > destinationDate)
  debug( `shouldRecompile: Outdated file found (${sourceDate - destinationDate}): ${path.relative(path.resolve('.'), destinationFile)} (${destinationDate}) is outdated becasue ${path.relative(path.resolve('.'), sourceFile)} (${sourceDate}) has changed.` );
  if (sourceDate > destinationDate) return true; // the destination is outdated;
}

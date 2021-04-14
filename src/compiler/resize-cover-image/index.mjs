import debugContext from 'debug';
const debug = debugContext('resize-cover-image');

import path from "path";
import { readFile } from "fs/promises";

import util from 'util';
import child_process from 'child_process';
const execFile = util.promisify(child_process.execFile);

import { shouldRecompile } from "../helpers.mjs";
import { coverImages } from "../../helpers.mjs";

export {
  resizeCoverImage,
};

async function resizeCoverImage(dataDirectory, entry) {
  for(const image of coverImages){
    const filesDirectory = path.join(dataDirectory, "files");
    const cacheDirectory = path.join(dataDirectory, "cache");
    const sourceFile = path.join(filesDirectory, entry.image);
    const destinationFile = path.join(cacheDirectory, `${image.id}-${entry.image}`);
    if(await shouldRecompile(destinationFile, sourceFile)){
      const commandArguments = image.arguments
      .map(i=>i==='SOURCE'?sourceFile:i)
      .map(i=>i==='DESTINATION'?destinationFile:i);
      debug(`Resizing ${entry.id} cover image to ${image.id} size`)
      const { stdout } = await execFile(image.command, commandArguments);
      if(stdout.trim()) debug(stdout);
    }
  }
  return true;
}

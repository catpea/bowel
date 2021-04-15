import debugContext from 'debug';
const debug = debugContext('download-video-thumbnails');

import path from "path";
import { utimesSync, existsSync } from "fs";
import { readFile, readdir } from "fs/promises";

import util from 'util';
import child_process from 'child_process';
const execFile = util.promisify(child_process.execFile);

import yaml from 'js-yaml';

import {createWriteStream, unlinkSync} from 'fs';
import {pipeline} from 'stream';
import {promisify} from 'util';
import fetch from 'node-fetch';

const streamPipeline = promisify(pipeline);

import { gatherImages } from "../../helpers.mjs";

import { shouldRecompile } from "../helpers.mjs";

export {
  downloadVideoThumbnails,
};

async function downloadVideoThumbnails(dataDirectory, entry) {

  const filesDirectory = path.join(dataDirectory, "files");
  const cacheDirectory = path.join(dataDirectory, "cache");

  const contentFile = path.join(dataDirectory, 'content.yaml');
  const database = yaml.load((await readFile(contentFile)).toString())

  const databaseIds = database.filter(o=>o.type === 'youtube');
  const databaseFiles = databaseIds.map(s=>`yid-${s.id}.jpg`)

  // Cleanup Here
  const currentFiles = (await readdir(filesDirectory, { withFileTypes: true }))
  .filter(o => o.isFile())
  .map(o => o.name)
  .filter(s => s.startsWith('yid-'))
  .filter(s => s.endsWith('.jpg'))
  .filter(s=>databaseFiles.indexOf(s) === -1)
  .map(s=>path.join(filesDirectory, s))
  .map(s=>unlinkSync(s))

  for(let video of databaseIds){
    const downloadUrl = `https://img.youtube.com/vi/${video.id}/0.jpg`;
    const destinationFile = path.join(filesDirectory, `yid-${video.id}.jpg`);
    if(!existsSync(destinationFile)){
      console.log('Downloading Thumbnail',destinationFile)
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`unexpected response ${response.statusText}`);
      await streamPipeline(response.body, createWriteStream(destinationFile));
    }
  }

  return true;

}

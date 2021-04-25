import debugContext from 'debug';
const debug = debugContext('compiler');

import path from "path";
import { existsSync, statSync } from "fs";
import { readFile, mkdir, writeFile, copyFile} from "fs/promises";

import yaml from "js-yaml";

import cliProgress from 'cli-progress';
import colors from 'colors';

import { buildRecord } from "./build-record/index.mjs";

import {
  resizeCoverImage,
  downloadVideoThumbnails,
  createContactSheetImage,
  convertAudioToVideo,
  createMirror,
  createWebsite,
} from "./plugins/index.mjs";

import { coverImages, gatherImages, getFiles } from "../helpers.mjs";

export default {
  indexParse,
  createDistribution
};


async function indexParse(target) {
  const indexFile = path.join(path.resolve(target), "index.json");
  debug(`Loading: ${indexFile}`)
  return JSON.parse((await readFile(indexFile)).toString());
}


// plugins: {
//   resizeCoverImage: {},
//   convertAudioToVideo: {},
//   createMirror: {},
//   createWebsite: {},
//   //createContactSheetImage: {},
//   //downloadVideoThumbnails: {},
// }
async function createDistribution(configuration, ix) {

  const baseDirectory = path.resolve(ix.name);
  const mergeDirectory = path.join(path.resolve("merge"), ix.name);
  const projectDirectory = path.join(path.resolve("dist"), ix.name);

  await mkdir(mergeDirectory, { recursive: true });
  await mkdir(projectDirectory, { recursive: true });
  debug(`Created distribution directory: ${projectDirectory}`)

  if(ix.plugins?.resizeCoverImage){
    await mkdir(path.join(projectDirectory, 'image'), { recursive: true });
  }

  if(ix.plugins?.convertAudioToVideo){
    await mkdir(path.join(projectDirectory, 'audio'), { recursive: true });
  }

  if(ix.plugins?.downloadVideoThumbnails){
    await mkdir(path.join(projectDirectory, 'image'), { recursive: true });
  }

  if(ix.plugins?.createContactSheetImage){
    await mkdir(path.join(projectDirectory, 'image'), { recursive: true });
  }


  const data = [];
  const progressBar = new cliProgress.SingleBar({ format: 'Creating Object: |' + colors.yellow('{bar}') + '| {percentage}% || {value}/{total} Entries', barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true }, cliProgress.Presets.shades_classic);
  if (!process.env.DEBUG) progressBar.start(ix.data.length-1, 0); debug('create directories progress bar has been disabled for DEBUG mode');
  let progressCounter = 0;
  for (const entry of ix.data) {
    progressBar.update(progressCounter++);
    debug(`Processing ${entry}, ${ix.data.indexOf(entry)+1}/${ix.data.length}`);
    debug('Building the record...')
    const directory = path.join(baseDirectory, entry);
    const record = await buildRecord(ix, directory); // NOTE: data becomes available here, previously it was just an array of indexes.
    data.push(record);

    if(ix.plugins?.resizeCoverImage){
      await resizeCoverImage(directory, record);
      await copyCoverImages(directory, projectDirectory, record);
    }

    if(ix.plugins?.convertAudioToVideo){
      await convertAudioToVideo(directory, record);
      await copyAudio(directory, projectDirectory, record);
    }

    if(ix.plugins?.downloadVideoThumbnails){
      await downloadVideoThumbnails(directory, record);
      await copyVideoThumbnails(directory, projectDirectory, record);
    }

    if(ix.plugins?.createContactSheetImage){
      await createContactSheetImage(directory, record);
      await resizeCoverImage(directory, record);
      await copyCoverImages(directory, projectDirectory, record);
    }

    if (ix.plugins?.localAssets){
      await copyLocalAssets(directory, projectDirectory, record);
    }

  }
  progressBar.stop();

  debug(`Merging dependencies`)
  await mergeDependencies(mergeDirectory, projectDirectory);

  debug('Creating the new server object file...')
  const recompiled = Object.assign({}, ix, { data });
  recompiled.format = 'v2';

  const outputFile = path.join(projectDirectory, ix.name + ".json");
  await writeFile(outputFile, JSON.stringify(recompiled, null, "  "));
  debug(`Created: ${outputFile}`);

  if(ix.plugins?.createMirror){
    debug('Creating a mirror...')
    await createMirror(projectDirectory, recompiled);
  }

  if(ix.plugins?.createWebsite){
    debug('Creating website...')
    console.log(projectDirectory, configuration.destination);
    const destination = path.resolve(projectDirectory, configuration.destination);
    await createWebsite(configuration, destination);
  }


}


async function mergeDependencies(mergeDirectory, projectDirectory) {
  for await (const sourceFile of getFiles(mergeDirectory)) {
    const relativeName = path.relative(mergeDirectory, sourceFile);
    const destinationFile = path.join(projectDirectory, relativeName)
    debug(`Copying dependency ${relativeName}`);
    if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
  }
}

async function shouldCopyFile(sourceFile, destinationFile) {
  if (!existsSync(destinationFile)) return true; // yes it is outdated, it does not even exit
  const destinationStats = statSync(destinationFile);
  const sourceStats = statSync(sourceFile);
  const destinationDate = new Date(destinationStats.mtime);
  const sourceDate = new Date(sourceStats.mtime);
  if (sourceDate > destinationDate) debug( `shouldCopyFile: Outdated file found: ${destinationFile} (${destinationDate}) is outdated becasue ${sourceFile} (${sourceDate}) has changed.` );
  if (sourceDate > destinationDate) return true; // the destination is outdated;
}



async function copyAudio(dataDirectory, distDirectory, entry) {
  if(!entry.audio) return; // sometimes things don't have an audio version
  const filesDirectory = path.join(dataDirectory, "files");
  const sourceFile = path.join(filesDirectory, entry.audio);
  const destinationFile = path.join(distDirectory, 'audio', entry.audio);
  if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
  return true;
}

async function copyCoverImages(dataDirectory, distDirectory, entry) {
  for(const image of coverImages){
    const filesDirectory = path.join(dataDirectory, "files");
    const cacheDirectory = path.join(dataDirectory, "cache");
    const sourceFile = path.join(cacheDirectory, `${image.id}-${entry.image}`);
    const destinationFile = path.join(distDirectory, 'image', `${image.id}-${entry.image}`);
    if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
  }
}
async function copyVideoThumbnails(dataDirectory, distDirectory, entry) {
  const yamlContentFile = path.join(dataDirectory, "content.yaml");
  const database = yaml.load(await readFile(yamlContentFile));
  const sourceFiles = (await gatherImages(database));
  for(const image of sourceFiles){
    const filesDirectory = path.join(dataDirectory, "files");
    const cacheDirectory = path.join(dataDirectory, "cache");
    const sourceFile = path.join(filesDirectory, image);
    const destinationFile = path.join(distDirectory, 'image', image);
    if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
  }
}

async function copyLocalAssets(dataDirectory, distDirectory, entry) {

  //NOTE: assets are found in .links
  for (const image of entry.images) {
      const fileName = path.basename(image.url)
      // if(fileName.startsWith('yid-')) continue;

      const filesDirectory = path.join(dataDirectory, "files");
      const cacheDirectory = path.join(dataDirectory, "cache");
      const destinationDirectory = path.join( distDirectory );
      const sourceFile = path.join(filesDirectory, fileName);
      const destinationFile = path.join( destinationDirectory, 'image', fileName);
      if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);

      // for(const coverImage of coverImages){
      //   const sourceFile = path.join(cacheDirectory, `${coverImage.id}-${fileName}`);
      //   const destinationFile = path.join( destinationDirectory, 'image', `${coverImage.id}-${fileName}` );
      //   if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
      // }
  }

  for (const link of entry.links) {
    if (!link.url.startsWith("http")) {
      const filesDirectory = path.join(dataDirectory, "files");
      const sourceFile = path.join(filesDirectory, path.basename(link.url));
      const destinationDirectory = path.join( distDirectory, path.dirname(link.url) );
      const destinationFile = path.join( destinationDirectory, path.basename(link.url) );
      if(await shouldCopyFile(sourceFile, destinationFile)){
        await mkdir(path.dirname(destinationFile), { recursive: true });
        await copyFile(sourceFile, destinationFile);
      }
    }
  }

  return true;
}

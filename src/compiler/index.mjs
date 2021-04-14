import debugContext from 'debug';
const debug = debugContext('compiler');

import path from "path";
import { readFile } from "fs/promises";

import { buildRecord } from "./build-record/index.mjs";

export default {
  indexParse,
  createDistribution
};


async function indexParse(target) {
  const indexFile = path.join(path.resolve(target), "index.json");
  debug(`Loading: ${indexFile}`)
  return JSON.parse((await readFile(indexFile)).toString());
}

async function createDistribution(ix) {

  const baseDirectory = path.resolve(path.resolve(ix.name));
  const projectDirectory = path.join(path.resolve("dist"), ix.name);
  await mkdir(projectDirectory, { recursive: true });
  const projectImageDirectory = path.join(projectDirectory, 'image');
  await mkdir(projectImageDirectory, { recursive: true });
  const projectAudioDirectory = path.join(projectDirectory, 'audio');
  await mkdir(projectAudioDirectory, { recursive: true });
  debug(`Created distribution directory: ${projectDirectory}`)

  const data = [];

  for (const entry of ix.data) {
    const directory = path.join(baseDirectory, entry);
    debug('Building the record...')
    const record = await buildRecord(directory);
    data.push(record);
    break;

    debug('Generating media...')
    // Create Into Cache based on stuff in files
    if (ix.coverImages) await resizeCoverImage(directory, record);

    if (ix.contactSheet) await createContactSheetImage(directory, record);
    if (ix.audioVersion) await convertAudioToVideo(directory, record);

    debug('Copying files into the distribution directory...')
    // Copy To Dist from Cache
    if (ix.audioVersion) await copyAudio(directory, projectDirectory, record);
    if (ix.coverImages) await copyCoverImages(directory, projectDirectory, record);
    if (ix.localAssets) await copyLocalAssets(directory, projectDirectory, record);
  }

  const recompiled = Object.assign({}, ix, { data });
  recompiled.format = 'v2';
  const outputFile = path.join(projectDirectory, ix.name + ".json");
  await writeFile(outputFile, JSON.stringify(recompiled, null, "  "));
  debug(`Created: ${outputFile}`);
}

import fs from "fs";
import path from "path";
import { mkdir, writeFile, readFile, copyFile, readdir } from "fs/promises";
import cliProgress from 'cli-progress';
import colors from 'colors';
import yaml from 'js-yaml';

import {
  readRecord,
  isOutdated,
  createRecord,
  contentFile,
  buildRecord,
  isCacheValid,
  textVersion,
  listImages,
  listLinks,
  resizeCoverImage,
  createContactSheetImage,
  convertAudioToVideo,
  copyAudio,
  copyCoverImages,
  copyLocalAssets,
  gatherImages,
} from "./helpers.mjs";

export default {
  jsonParse,
  createIndex,
  createDirectories,
  importFiles,
  indexParse,
  createDistribution,
};

async function createIndex(so) {
  const baseDirectory = path.resolve(path.join(".", so.name));
  console.log(baseDirectory);
  await mkdir(baseDirectory, { recursive: true });
  const head = Object.keys(so)
    .filter((i) => i !== "data")
    .map((i) => [i, so[i]]);
  const data = so.data.map((i) => i.id);
  head.push(["data", data]);
  const index = Object.fromEntries(head);
  const indexFileLocation = path.join(baseDirectory, "index.json");
  await writeFile(indexFileLocation, JSON.stringify(index, null, "  "));
}

async function importFiles(so, releaseDir, webDir, audioDir, imageDir) {
  const baseDirectory = path.resolve(path.join(".", so.name));

  const progressBar = new cliProgress.SingleBar({ format: 'Importing Files: |' + colors.yellow('{bar}') + '| {percentage}% || {value}/{total} Entries', barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true }, cliProgress.Presets.shades_classic);
  progressBar.start(so.data.length-1, 0);
  let progressCounter = 0;

  const fused = {}
  if(so.yamlDatabase){
    const index = yaml.load(await readFile('/home/meow/Universe/Development/warrior/db/index.yaml'));
    for(const item of index){
      item.data = yaml.load(await readFile(`/home/meow/Universe/Development/warrior/db/${item.name}/index.yaml`));
      for (let section of item.data) {
        if (section.text) {
          section.text = (await readFile(`/home/meow/Universe/Development/warrior/db/${item.name}/${section.text}`)).toString();
        }
      }
      fused[item.name] = item.data;
    }
  }

  for (const item of so.data) {
    progressBar.update(progressCounter++);

    const mainDirectory = path.join(baseDirectory, item.id);
    const filesDirectory = path.join(baseDirectory, item.id, "files");
    const cacheDirectory = path.join(baseDirectory, item.id, "cache");
    await mkdir(filesDirectory, { recursive: true });




    // /home/meow/Universe/Development/warrior/db/the-adventurer/index.yaml
    //contactSheet

    if(so.yamlDatabase){
      const id = item.id.split(so.name + '-').pop();
      const contentFile = path.join(mainDirectory, 'content.yaml');
      await writeFile(contentFile, yaml.dump(fused[id], {lineWidth: 32_000}))
      const imageDependencies = (await gatherImages(fused[id]));

      for(const image of imageDependencies){
        const sourceFile = path.join('/home/meow/Universe/Development/warrior/docs/images', image);
        const destinationFile = path.join(filesDirectory, image);
        if (!fs.existsSync(destinationFile)) {
          copyFile(sourceFile, destinationFile);
        }
      }





    }






    if (audioDir) {

      if (item.audio) {
        const sourceFile = path.join(audioDir, item.audio);
        const destinationFile = path.join(filesDirectory, item.audio);
        if (!fs.existsSync(destinationFile)) {
          copyFile(sourceFile, destinationFile);
        }
      }
      if (item.audio) {
        //dist/video
        const sourceFile = path.join(releaseDir, 'video', path.basename(item.audio, '.mp3') + '.mp4');
        const destinationFile = path.join(cacheDirectory, path.basename(item.audio, '.mp3') + '.mp4');
        if (!fs.existsSync(destinationFile)) {
          //console.log(sourceFile, destinationFile);
          copyFile(sourceFile, destinationFile);
        }
      }


    } else {
      if (item.audio) {
        console.warn(
          `WARN: ${item.audio} was not imported because audioDir was not specified`
        );
      }
    }



    if (imageDir) {
      if (item.image) {
        const sourceFile = path.join(imageDir, item.image);
        const destinationFile = path.join(filesDirectory, item.image);
        if (!fs.existsSync(destinationFile)) {
          copyFile(sourceFile, destinationFile);
        }
      }



      if (so.coverImages) { // cover images only feature
        if (item.image) {
          const variations = [ 'bl', 'ss', 'xs', 'sm', 'md', 'lg', 'xl' ];
          for (const variant of variations) {
            const sourceFile = path.join(releaseDir, 'image', `${variant}-${item.image}`);
            const destinationFile = path.join(cacheDirectory, `${variant}-${item.image}`);
            if (fs.existsSync(sourceFile)) { // sometimes there are no responsive versions
              if (!fs.existsSync(destinationFile)) {
                copyFile(sourceFile, destinationFile);
              }
            }
          }
        }
      }

      if (item.images) {
        for (const image of item.images) {
          const sourceFile = path.join(imageDir, image.url);
          const destinationFile = path.join(filesDirectory, image.url);
          if (!fs.existsSync(destinationFile)) {
            copyFile(sourceFile, destinationFile);
          }
        }
      }
    } else {
      if (item.image) {
        console.warn(
          `WARN: ${item.image} was not imported because imageDir was not specified`
        );
      }
      if (item.images) {
        for (const image of item.images) {
          console.warn(
            `WARN: ${image.url} was not imported because imageDir was not specified`
          );
        }
      }
    }


    if (webDir) {
      if (item.links) {
        for (const link of item.links) {
          if (!link.url.startsWith("http")) {
            const sourceFile = path.join(webDir, link.url);
            const destinationFile = path.join(
              filesDirectory,
              path.basename(link.url)
            );
            if (!fs.existsSync(destinationFile)) {
              copyFile(sourceFile, destinationFile);
            }
          }
        }
      }
    } else {
      if (item.links) {
        for (const link of item.links) {
          if (!link.url.startsWith("http")) {
            console.warn(
              `WARN: ${link.url} was not imported because webDir was not specified`
            );
          }
        }
      }
    }
  }
  progressBar.stop();
}

async function createDirectories(so) {
  const baseDirectory = path.resolve(path.join(".", so.name));

  const progressBar = new cliProgress.SingleBar({ format: 'Processing Data: |' + colors.yellow('{bar}') + '| {percentage}% || {value}/{total} Entries', barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true }, cliProgress.Presets.shades_classic);
  progressBar.start(so.data.length-1, 0);
  let progressCounter = 0;

  for (const item of so.data) {
    progressBar.update(progressCounter++);

    // pre-create directories
    const dataDirectory = path.join(baseDirectory, item.id);
    const filesDirectory = path.join(baseDirectory, item.id, "files");
    const cacheDirectory = path.join(baseDirectory, item.id, "cache");
    await mkdir(dataDirectory, { recursive: true });
    await mkdir(filesDirectory, { recursive: true });
    await mkdir(cacheDirectory, { recursive: true });
    // create configuration
    const dynamicFields = ["text", "images", "links", "print"];
    const requiredFields = ["title", "date", "image", "audio", "id"];
    const configuration = Object.fromEntries(
      Object.keys(item)
        .filter((i) => requiredFields.includes(i))
        .map((i) => [i, item[i]])
    );

    // content that cache is created from
    if(!so.yamlDatabase){
      await writeFile(path.join(dataDirectory, "content.html"), item.html);
    }

    await writeFile(
      path.join(dataDirectory, "configuration.json"),
      JSON.stringify(configuration, null, "  ")
    );

    // cache of processed content and options
    await writeFile(
      path.join(cacheDirectory, "configuration.json"),
      JSON.stringify(configuration, null, "  ")
    );
    await writeFile(path.join(cacheDirectory, "content.html"), item.html);
    await writeFile(
      path.join(cacheDirectory, "links.json"),
      JSON.stringify(item.links, null, "  ")
    );
    await writeFile(
      path.join(cacheDirectory, "images.json"),
      JSON.stringify(item.images, null, "  ")
    );
    await writeFile(path.join(cacheDirectory, "content.txt"), item.text);

    // and the record that is made out of cache
    await writeFile(
      path.join(cacheDirectory, "record.json"),
      JSON.stringify(item, null, "  ")
    );
  }
    progressBar.stop();
}

async function jsonParse(target) {
  return JSON.parse(fs.readFileSync(target).toString());
}

async function getSchema(so) {
  const schema = { keys: [], data: {}, count: 0 };
  Object.keys(so)
    .filter((i) => typeof so[i] === "string")
    .map((i) => (schema[i] = so[i]));
  schema.count = so.data.length;
  for (let key of Object.keys(so)) {
    schema.keys.push(key);
  }
  for (let file of so.data) {
    for (let key of Object.keys(file)) {
      if (!schema.data[key]) schema.data[key] = 0;
      schema.data[key]++;
    }
  }
  return schema;
}

async function indexParse(target) {
  const indexFile = path.join(path.resolve(target), "index.json");
  return JSON.parse(fs.readFileSync(indexFile).toString());
}

async function createDistribution(ix) {
  const baseDirectory = path.resolve(path.resolve(ix.name));
  const projectDirectory = path.join(path.resolve("dist"), ix.name);
  await mkdir(projectDirectory, { recursive: true });
  const projectImageDirectory = path.join(projectDirectory, 'image');
  await mkdir(projectImageDirectory, { recursive: true });
  const projectAudioDirectory = path.join(projectDirectory, 'audio');
  await mkdir(projectAudioDirectory, { recursive: true });

  const data = [];

  for (const entry of ix.data) {
    const directory = path.join(baseDirectory, entry);
    const record = await buildRecord(directory);
    data.push(record);


    // Create Into Cache based on stuff in files
    if (ix.coverImages) await resizeCoverImage(directory, record);

    if (ix.contactSheet) await createContactSheetImage(directory, record);
    if (ix.audioVersion) await convertAudioToVideo(directory, record);

    // Copy To Dist from Cache
    if (ix.audioVersion) await copyAudio(directory, projectDirectory, record);
    if (ix.coverImages) await copyCoverImages(directory, projectDirectory, record);
    if (ix.localAssets) await copyLocalAssets(directory, projectDirectory, record);
  }

  const recompiled = Object.assign({}, ix, { data });
  recompiled.format = 'v2';
  const outputFile = path.join(projectDirectory, ix.name + ".json");
  await writeFile(outputFile, JSON.stringify(recompiled, null, "  "));
  console.log(`Created: ${outputFile}`);
}

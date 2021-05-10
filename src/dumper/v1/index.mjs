import debugContext from 'debug';
const debug = debugContext('decompiler');

import path from "path";
import { existsSync } from "fs";
import { mkdir, writeFile, readFile, copyFile } from "fs/promises";

import invariant from 'invariant';
import cliProgress from 'cli-progress';
import colors from 'colors';
import yaml from 'js-yaml';

import { readServerObject, gatherImages, } from "../../helpers.mjs";

export default {
  createIndex,
  createData,
  importFiles,
  readServerObject,
};



async function createIndex({so}) {
  const baseDirectory = path.resolve(path.join(".", so.name));
  await mkdir(baseDirectory, { recursive: true });
  const data = so.data.map((i) => i.id);
  const index = {data};
  const indexFileLocation = path.join(baseDirectory, "index.json");
  await writeFile(indexFileLocation, JSON.stringify(index, null, "  "));
  debug(`created index: ${indexFileLocation}`);
}
// async function createIndex({so}) {
//   const baseDirectory = path.resolve(path.join(".", so.name));
//   await mkdir(baseDirectory, { recursive: true });
//   const head = Object.keys(so)
//     .filter((i) => i !== "data")
//     .map((i) => [i, so[i]]);
//   const data = so.data.map((i) => i.id);
//   head.push(["data", data]);
//   const index = Object.fromEntries(head);
//   const indexFileLocation = path.join(baseDirectory, "index.json");
//   await writeFile(indexFileLocation, JSON.stringify(index, null, "  "));
//   debug(`created index: ${indexFileLocation}`);
// }



























async function createData({so, yamlDb}) {
  const baseDirectory = path.resolve(path.join(".", so.name));

  const fused = {}

  if(yamlDb){
    debug(`Importing yaml database and creating a local abstraction...`);
    const index = yaml.load(await readFile(path.join(yamlDb,'index.yaml')));
    for(const item of index){
      item.data = yaml.load(await readFile(path.join(yamlDb,`${item.name}/index.yaml`)));
      for (let section of item.data) {
        if (section.text) {
          section.text = (await readFile(path.join(yamlDb,`${item.name}/${section.text}`))).toString();
        }
      }
      fused[item.name] = item.data;
    }
  }

  const progressBar = new cliProgress.SingleBar({ format: 'Processing Data: |' + colors.yellow('{bar}') + '| {percentage}% || {value}/{total} Entries', barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true }, cliProgress.Presets.shades_classic);
  if (!process.env.DEBUG) progressBar.start(so.data.length-1, 0); debug('create directories progress bar has been disabled for DEBUG mode');
  let progressCounter = 0;

  let itemIndex = 0;
  for (const item of so.data) {

    progressBar.update(progressCounter++);
    debug(`Processing ${item.id}, ${so.data.indexOf(item)+1}/${so.data.length}`);

    debug(`Creating directories...`);
    const dataDirectory = path.join(baseDirectory, item.id);
    const filesDirectory = path.join(baseDirectory, item.id, "files");
    const cacheDirectory = path.join(baseDirectory, item.id, "cache");
    await mkdir(dataDirectory, { recursive: true });
    await mkdir(filesDirectory, { recursive: true });
    await mkdir(cacheDirectory, { recursive: true });

    if(yamlDb){
      debug(`Creating content.yaml for ${item.id}`);
      const id = item.id.split(so.name + '-').pop();
      const contentFile = path.join(dataDirectory, 'content.yaml');
      const yamlData = yaml.dump(fused[id], {lineWidth: 32_000});
      const existingData = (await readFile(contentFile)).toString();

      if(yamlData === existingData){
        debug(`Skipped writing to ${item.id}/content.yaml becasue data is the same.`);
      }else{
        debug(`Writing to ${item.id}/content.yaml becasue data differs ${yamlData.length} vs ${existingData.length} bytes`);
        await writeFile(contentFile, yamlData)
      }

    }

    // content that cache is created from
    if(!yamlDb){
      debug(`This is not a yaml database, so dumping item.html as content.html`);

      // QUICKFIX: no md- prefic for inner linked images whatever the user links is that image.
      item.html = item.html.replace(/<img src="\/image\/..-/g, '<img src="/image/'); // During import remove the prefixes in content.html <img src="/image/md-poetry-0025-x.jpg" alt="X"> rename md-poetry-0025-x.jpg to poetry-0025-x.jpg

      await writeFile(path.join(dataDirectory, "content.html"), item.html);
    }

    debug(`Creating configuration file and cache...`);
    // create configuration
    const dynamicFields = ["text", "images", "links", "print"];
    const requiredFields = ["title", "date", "image", "artwork", "audio", "id"];
    const configuration = Object.fromEntries(
      Object.keys(item)
        .filter((i) => requiredFields.includes(i))
        .map((i) => [i, item[i]])
    );

    if(itemIndex === 0 && so.dependencies){

      configuration.attachments = Object.fromEntries(Object.entries(so.dependencies).map(([name, value])=>[path.basename(name), value]));
    }

    if(!configuration.attachments){
      configuration.attachments = {};
    }

    await writeFile( path.join(dataDirectory, "configuration.json"), JSON.stringify(configuration, null, "  ") );
    //await writeFile( path.join(cacheDirectory, "configuration.json"), JSON.stringify(configuration, null, "  ") ); // cache of processed content and options

    debug(`Creating content related files and cache...`);

    if(!yamlDb){
      ///       await writeFile(path.join(cacheDirectory, "html.html"), item.html);
    }
    /// await writeFile( path.join(cacheDirectory, "links.json"), JSON.stringify(item.links, null, "  ") );
    /// await writeFile( path.join(cacheDirectory, "images.json"), JSON.stringify(item.images, null, "  ") );
    /// await writeFile(path.join(cacheDirectory, "content.txt"), item.text);

    // DO NOT create record.json, too much changes between releases, it needs to be re-created
    // debug(`Creating record.json in cache directory...`)
    // await writeFile( path.join(cacheDirectory, "record.json"), JSON.stringify(item, null, "  ") );

    itemIndex++;
  }
  debug(`Finished creating data, cache and records.`)
  progressBar.stop();
}


















async function importFiles({so, rootDir, distDir, webDir, audioDir, imageDir, yamlDb, coverImages}) {
  const baseDirectory = path.resolve(path.join(".", so.name));

  const progressBar = new cliProgress.SingleBar({ format: 'Importing Files: |' + colors.yellow('{bar}') + '| {percentage}% || {value}/{total} Entries', barCompleteChar: '\u2588', barIncompleteChar: '\u2591', hideCursor: true }, cliProgress.Presets.shades_classic);
  if (!process.env.DEBUG) progressBar.start(so.data.length-1, 0); debug('import files progress bar has been disabled for DEBUG mode')
  let progressCounter = 0;


  if (so.dependencies) {
    for(const [src, dest] of Object.entries(so.dependencies)){
      const destinationDir = path.join(baseDirectory, so.data[0].id, 'files');
      const sourceFile = path.join(rootDir, src);
        const destinationFile = path.join(destinationDir, path.basename(src));
        if (!existsSync(destinationFile)) {
          debug(`Importing dependency: ${src} into ${dest}`);
          await copyFile(sourceFile, destinationFile);
        }
    }
  }

  // const mergeDirectory = path.join(path.resolve('merge'), so.name);
  // if (so.dependencies) {
  //   for(const [src, dest] of Object.entries(so.dependencies)){
  //     const destinationDir = path.join(mergeDirectory, dest);
  //     await mkdir(destinationDir, { recursive: true });
  //       const sourceFile = path.join(rootDir, src);
  //       const destinationFile = path.join(destinationDir, path.basename(src));
  //       if (!existsSync(destinationFile)) {
  //         debug(`Importing dependency: ${src} into ${dest}`);
  //         await copyFile(sourceFile, destinationFile);
  //       }
  //   }
  // }

  for (const item of so.data) {
    progressBar.update(progressCounter++);

    debug(`Importing data for ${item.id}, ${so.data.indexOf(item)+1}/${so.data.length}`);

    //const mainDirectory = path.join(baseDirectory, item.id);
    const dataDirectory = path.join(baseDirectory, item.id);
    const filesDirectory = path.join(baseDirectory, item.id, 'files');
    const cacheDirectory = path.join(baseDirectory, item.id, 'cache');
    await mkdir(filesDirectory, { recursive: true });


    if(yamlDb){

      const contentFile = path.join(dataDirectory, 'content.yaml');
      const database = yaml.load((await readFile(contentFile)).toString())
      const imageDependencies = (await gatherImages(database));

      for(const image of imageDependencies){
        const sourceFile = path.join(webDir, 'images', image);
        const destinationFile = path.join(filesDirectory, image);
        if (!existsSync(destinationFile)) {
          debug(`Importing content.yaml image: ${image}`);
          await copyFile(sourceFile, destinationFile);
        }
      } // for

      if (item.image) {
        const sourceFile = path.join(webDir, 'images', item.image);
        const destinationFile = path.join(filesDirectory, item.image);
        if (!existsSync(destinationFile)) {
          debug(`Importing main image for yaml item: ${item.image}`);
          await copyFile(sourceFile, destinationFile);
        }
      }

    }

    if (audioDir) {
      if (item.audio) {
        const sourceFile = path.join(audioDir, item.audio);
        const destinationFile = path.join(filesDirectory, item.audio);
        if (!existsSync(destinationFile)) {
          debug(`Importing audio: ${item.audio}`);
          await copyFile(sourceFile, destinationFile);
        }
      }

      if (item.audio) {
        const fileName = path.basename(item.audio, '.mp3') + '.mp4';
        const sourceFile = path.join(distDir, 'video', fileName);
        const destinationFile = path.join(cacheDirectory, fileName);
        if (!existsSync(destinationFile)) {
          debug(`Not importing video version of audio: ${fileName}`);
          // NOTE: THIS IS 30 GB TTO MUCH DATA FOR GITHUB... await copyFile(sourceFile, destinationFile);
        }
      }
    } // if audio

    if (imageDir) {
      if (item.image) {
        const sourceFile = path.join(imageDir, item.image);
        const destinationFile = path.join(filesDirectory, item.image);
        if (!existsSync(destinationFile)) {
          debug(`Importing main image: ${item.image}`);
          await copyFile(sourceFile, destinationFile);
        }
      }

      if (coverImages) { // cover images only feature
        if (item.image) {
          const variations = [ 'bl', 'ss', 'xs', 'sm', 'md', 'lg', 'xl' ];
          for (const variant of variations) {
            const sourceFile = path.join(distDir, 'image', `${variant}-${item.image}`);
            const destinationFile = path.join(cacheDirectory, `${variant}-${item.image}`);
            if (existsSync(sourceFile)) { // sometimes there are no responsive versions
              if (!existsSync(destinationFile)) {
                debug(`Importing cover images: ${variant}-${item.image}`);
                await copyFile(sourceFile, destinationFile);
              }
            }
          }
        }
      }

      if (item.images) {
        for (const image of item.images) {
          const sourceFile = path.join(imageDir, image.url);
          const destinationFile = path.join(filesDirectory, image.url);
          if (!existsSync(destinationFile)) {
            debug(`Importing images noted in .images: ${image.url}`);
            await copyFile(sourceFile, destinationFile);
          }
        }
      }
    }

    if (webDir) {
      if (item.links) {
        for (const link of item.links) {
          if (!link.url.startsWith("http")) {
            const sourceFile = path.join(webDir, link.url);
            const destinationFile = path.join( filesDirectory, path.basename(link.url) );
            if (!existsSync(destinationFile)) {
              debug(`Importing local files noted in .links: ${link.url}`);
              await copyFile(sourceFile, destinationFile);
            }
          }
        }
      }
    }
  }
  debug(`Finished importing files.`)
  progressBar.stop();
}

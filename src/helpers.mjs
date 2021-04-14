import debugContext from 'debug';
const debug = debugContext('helpers');

import { readFile } from "fs/promises";

export {
  readServerObject,
  gatherImages
};

async function gatherImages(database) {
  const images = [];
  for (let section of database) {
    if(section.type == 'youtube'){
      images.push(`yid-${section.id}.jpg`);
    } else if(section.type == 'image'){
      images.push(`${section.url}`);
    } else if(section.type == 'business'){
      images.push(`${section.url}`);
    }
  } // for each section
  return images;
}

async function readServerObject(target) {
  const so = JSON.parse((await readFile(target)).toString());
  debug(`Server object format: ${so.format}`);
  return so;
}

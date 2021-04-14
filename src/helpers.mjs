import debugContext from 'debug';
const debug = debugContext('helpers');

import { readFile } from "fs/promises";

export {
  readServerObject,
  gatherImages,
  coverImages,
};

const coverImages = [
  {id: 'bl', command:'convert', arguments:['-define', 'jpeg:size=160x160', 'SOURCE', '-thumbnail', '100x100^', '-gravity', 'center', '-extent', '100x100', '-gaussian-blur', '0x3', '-quality', 90, 'DESTINATION']},
  {id: 'ss', command:'convert', arguments:['-define', 'jpeg:size=160x160', 'SOURCE', '-thumbnail', '100x100^', '-gravity', 'center', '-extent', '100x100', '-quality', '90', 'DESTINATION']},
  {id: 'xs', command:'convert', arguments:['-define', 'jpeg:size=320x200', 'SOURCE', '-thumbnail', '200x200^', '-gravity', 'center', '-extent', '200x200', '-quality', '90', 'DESTINATION']},
  {id: 'sm', command:'convert', arguments:['-define', 'jpeg:size=640x480', 'SOURCE', '-thumbnail', '300x300^', '-gravity', 'center', '-extent', '300x300', '-quality', '90', 'DESTINATION']},
  {id: 'md', command:'convert', arguments:['-define', 'jpeg:size=800x600', 'SOURCE', '-thumbnail', '500x500^', '-gravity', 'center', '-extent', '500x500', '-quality', '90', 'DESTINATION']},
  {id: 'lg', command:'convert', arguments:['-define', 'jpeg:size=1024x768', 'SOURCE', '-thumbnail', '600x600^', '-gravity', 'center', '-extent', '600x600', '-quality', '90', 'DESTINATION']},
  {id: 'xl', command:'convert', arguments:['-define', 'jpeg:size=1920x1080', 'SOURCE', '-thumbnail', '1024x768^', '-gravity', 'center', '-extent', '1024x768', '-quality', '90', 'DESTINATION']},
]

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

import fs from 'fs';
import path from 'path';
import { mkdir, writeFile, copyFile } from 'fs/promises';

export default { jsonParse, createIndex, createDirectories, importFiles, };

async function createIndex(so){
  const baseDirectory = path.resolve( path.join('.', so.name) );
  console.log(baseDirectory);
  await mkdir(baseDirectory, {recursive: true});
  const head = Object.keys(so).filter(i=>(i !== 'data')).map(i=>[i, so[i]]);
  const data = so.data.map(i=>i.id);
  head.push(['data', data])
  const index = Object.fromEntries(head)
  const indexFileLocation = path.join(baseDirectory, 'index.json');
  await writeFile(indexFileLocation, JSON.stringify(index, null, '  '))
}

async function importFiles(so, webDir, audioDir, imageDir){
  const baseDirectory = path.resolve( path.join('.', so.name) );
  for(const item of so.data){
    const filesDirectory = path.join(baseDirectory, item.id, 'files');
    await mkdir(filesDirectory, {recursive: true});
    if(audioDir){
      if(item.audio){
        const sourceFile = path.join(audioDir, item.audio);
        const destinationFile = path.join(filesDirectory, item.audio);
        if (!fs.existsSync(destinationFile)){
          copyFile( sourceFile, destinationFile);
        }
      }
    }else{
      if(item.audio){
        console.warn( `WARN: ${item.audio} was not imported because audioDir was not specified`);
      }
    }
    if(imageDir){
      if(item.image){
        const sourceFile = path.join(imageDir, item.image);
        const destinationFile = path.join(filesDirectory, item.image);
        if (!fs.existsSync(destinationFile)){
          copyFile( sourceFile, destinationFile);
        }
      }
      if(item.images){
        for(const image of item.images){
          const sourceFile = path.join(imageDir, image.url);
          const destinationFile = path.join(filesDirectory, image.url);
          if (!fs.existsSync(destinationFile)){
            copyFile( sourceFile, destinationFile);
          }
        }
      }
    }else{
      if(item.image){
        console.warn( `WARN: ${item.image} was not imported because imageDir was not specified`);
      }
      if(item.images){
        for(const image of item.images){
          console.warn( `WARN: ${image.url} was not imported because imageDir was not specified`);
        }
      }
    }
    if(webDir){
      if(item.links){
        for(const link of item.links){
          if(!link.url.startsWith('http')){
            const sourceFile = path.join(webDir, link.url);
            const destinationFile = path.join(filesDirectory, path.basename(link.url));
            if (!fs.existsSync(destinationFile)){
               copyFile( sourceFile, destinationFile);
            }
          }
        }
      }
    }else{
      if(item.links){
        for(const link of item.links){
          if(!link.url.startsWith('http')){
            console.warn( `WARN: ${link.url} was not imported because webDir was not specified`);
          }
        }
      }
    }
  }
}

async function createDirectories(so){
  const baseDirectory = path.resolve( path.join('.', so.name) );
  for(const item of so.data){
    // pre-create directories
    const dataDirectory = path.join(baseDirectory, item.id);
    const filesDirectory = path.join(baseDirectory, item.id, 'files');
    const cacheDirectory = path.join(baseDirectory, item.id, 'cache');
    await mkdir(dataDirectory, {recursive: true});
    await mkdir(filesDirectory, {recursive: true});
    await mkdir(cacheDirectory, {recursive: true});
    // create configuration
    const dynamicFields = ['text', 'images', 'links', 'print'];
    const requiredFields = ['title', 'date', 'image', 'audio', 'id'];
    const configuration = Object.fromEntries(Object.keys(item).filter(i=>requiredFields.includes(i)).map(i=>[i, item[i]]));
    const configurationFileLocation = path.join(dataDirectory, 'configuration.json');
    await writeFile(configurationFileLocation, JSON.stringify(configuration, null, '  '))
    const contentFileLocation = path.join(dataDirectory, 'content.html');
    await writeFile(contentFileLocation, item.html)
  }
}

async function jsonParse(target){
  return JSON.parse(fs.readFileSync(target).toString());
}

async function getSchema(so){
  const schema = {keys:[], data:{}, count: 0};
  Object.keys(so).filter(i=>(typeof so[i] === 'string')).map(i=>schema[i]=so[i]);
  schema.count = so.data.length;
  for(let key of Object.keys(so)){
      schema.keys.push(key);
  }
  for(let file of so.data){
    for(let key of Object.keys(file)){
        if(!schema.data[key]) schema.data[key] = 0;
        schema.data[key]++
    }
  }
  return schema;
}

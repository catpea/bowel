import cheerio from 'cheerio';
import marked from 'marked';

import fs from 'fs';
import path from 'path';
import { mkdir, writeFile, copyFile, readdir } from 'fs/promises';

export default { jsonParse, createIndex, createDirectories, importFiles, indexParse, createDistribution, };

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
    console.log(`Processing: ${item.id}`);
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

    // content that cache is created from
    await writeFile(path.join(dataDirectory, 'content.html'), item.html);
    await writeFile(path.join(dataDirectory, 'configuration.json'), JSON.stringify(configuration, null, '  '))

    // cache of processed content and options
    await writeFile(path.join(cacheDirectory, 'configuration.json'), JSON.stringify(configuration, null, '  '))
    await writeFile(path.join(cacheDirectory, 'content.html'), item.html);
    await writeFile(path.join(cacheDirectory, 'links.json'), JSON.stringify(item.links, null, '  '));
    await writeFile(path.join(cacheDirectory, 'images.json'), JSON.stringify(item.images, null, '  '));
    await writeFile(path.join(cacheDirectory, 'content.txt'), item.text);

    // and the record that is made out of cache
    await writeFile(path.join(cacheDirectory, 'record.json'), JSON.stringify(item, null, '  '));

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












async function indexParse(target){
  const indexFile = path.join(path.resolve(target), 'index.json');
  return JSON.parse(fs.readFileSync(indexFile).toString());
}

async function createDistribution(ix){
  const baseDirectory = path.resolve( path.resolve(ix.name) );
  const projectDirectory = path.join(path.resolve('dist'), ix.name);
  await mkdir(projectDirectory, {recursive: true});
  const data = [];

  for(const entry of ix.data){
    const directory = path.join(baseDirectory, entry);
    const record = await buildRecord(directory);
    data.push(record);
  }

  const recompiled = Object.assign({},ix,{data});
  const outputFile = path.join(projectDirectory, ix.name + '.json');
  await writeFile(outputFile, JSON.stringify(recompiled, null, '  '));
  console.log(`Created: ${outputFile}`);
}

async function readRecord(target){
  return JSON.parse(fs.readFileSync(target).toString());
}
async function isOutdated(master, slave){
  let response = false;
  const masterStats = fs.statSync(master);
  const slaveStats = fs.statSync(slave);
  const masterDate = new Date(masterStats.mtime);
  const slaveDate = new Date(slaveStats.mtime);
  if(slaveDate > masterDate) console.log(`Outdated file found: ${master} (${masterDate}) is outdated becasue ${slave} (${slaveDate}) has changed.`);
  if(slaveDate > masterDate) response = true; // the master is outdated;
  return response;
}


async function createRecord(recordFile, directory){

  const dataDirectory = directory;
  const cacheDirectory = path.join(dataDirectory, 'cache');

  const item = {};
  Object.assign(item, JSON.parse(fs.readFileSync(path.join(directory, 'configuration.json')).toString()))

  // find html
  let html = '';
  const content = fs.readFileSync(path.join(directory, await contentFile(directory))).toString();
  if(path.extname(await contentFile(directory)) == '.html'){
    html = content;
  } else if(path.extname(await contentFile(directory)) == '.md'){
    html = marked(content)
  }

  // fill in the object
  item.html = html;
  item.text = textVersion(item.html);
  item.images = listImages(item.html);
  item.links = listLinks(item.html);

  const requiredFields = ['title', 'date', 'image', 'audio', 'id'];
  const configuration = Object.fromEntries(Object.keys(item).filter(i=>requiredFields.includes(i)).map(i=>[i, item[i]]));

  // content that cache is created from
  await writeFile(path.join(dataDirectory, 'content.html'), item.html);
  await writeFile(path.join(dataDirectory, 'configuration.json'), JSON.stringify(configuration, null, '  '))

  // cache of processed content and options
  await writeFile(path.join(cacheDirectory, 'configuration.json'), JSON.stringify(configuration, null, '  '))
  await writeFile(path.join(cacheDirectory, 'content.html'), item.html);
  await writeFile(path.join(cacheDirectory, 'links.json'), JSON.stringify(item.links, null, '  '));
  await writeFile(path.join(cacheDirectory, 'images.json'), JSON.stringify(item.images, null, '  '));
  await writeFile(path.join(cacheDirectory, 'content.txt'), item.text);

  // and the item that is made out of cache
  await writeFile(path.join(cacheDirectory, 'record.json'), JSON.stringify(item, null, '  '));

}

async function contentFile(directory){
  let candidates = [];
  let response = undefined;
  const files = await readdir(directory);
  for await (const file of files){
    if(file.startsWith('content.')) candidates.push(file);
  }
  response = candidates.pop();
  return response;
}

async function buildRecord(directory){
  const recordFile = path.join(directory, 'cache', 'record.json');
  const record = {};
  const cacheValid = await isCacheValid(recordFile, directory);

  if(cacheValid){
    //console.log(`Valid cache for ${recordFile}`);
    Object.assign(record, await readRecord(recordFile, directory));
  }else{
    console.log(`Invalid cache for ${recordFile}`);
    Object.assign(record, await createRecord(recordFile, directory));
  }
  return record;
}

async function isCacheValid(recordFile, directory){
    // check if record even exists
    if(!fs.existsSync(recordFile)) return false; // cache is considered invalid;

    // check fragment sources (cache is the master here)
    if(await isOutdated(path.join(directory, 'cache', 'content.html'), path.join(directory, await contentFile(directory)))) return false;
    if(await isOutdated(path.join(directory, 'cache', 'configuration.json'), path.join(directory, 'configuration.json'))) return false;

    // // check fragments
    if(await isOutdated(recordFile, path.join(directory, 'cache', 'configuration.json'))) return false;
    if(await isOutdated(recordFile, path.join(directory, 'cache', 'content.html'))) return false; // also considers links.json, images.json, content.txt since they are made out of the html

    // default
    return true;
}


















function textVersion(html){
  // This is the normalized text version.
  const $ = cheerio.load(html);
  // Destroy paragraphs with links, this is considered a stand-alone link line, a button, data not relevant to an excerpt.
  $('p > a').each(function(index, element){
    if($(element).parent().contents().length == 1) $(element).remove();
  })
  // Add texts so that links can be featured in text.
  let links = [];
  $('p > a').each(function(index, element){
    const name = $(element).text();
    const url = $(element).attr('href');
    links.push({name, url})
  })
  let text = $('body')
  .text().trim()
  .split("\n")
  .map(i=>i.trim())
  .join("\n")
  .replace(/\n{2,}/g,'\n\n').trim();
  if(links.length) text = text + "\n\n\n" + links.map(({name, url})=>`[${name}]: ${url}`).join("\n");
  return text;
}


function listImages(html){
  const $ = cheerio.load(html);
  const list = $('img') .map(function (i, el) { return {title: $(this).attr('title')||$(this).attr('alt'), url: $(this).attr('src').replace(/^\/image\/[a-z]{2}-/, '')} }).get()
  return list;
}

function listLinks(html){
  const $ = cheerio.load(html);
  const list = $('a') .map(function (i, el) {
    //console.log($(el).html());
    return {title: ($(this).attr('title')||$(this).text()), url: $(this).attr('href')}
  }).get().map(i=>{
    i.hostname = "local";
    try {
      i.hostname = new URL(i.url).hostname
    }catch(e){
      // borked.
    }
    return i;
  })
  return list;
}

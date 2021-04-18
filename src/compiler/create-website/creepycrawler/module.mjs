import path from 'path';
import mime from 'mime';
import got from 'got';
import cheerio from 'cheerio';
import invariant from 'invariant';
import url from 'url';
import kebabCase from 'lodash/kebabCase.js';

import stream from 'stream';
import {promisify} from 'util';
import fs from 'fs';
const pipeline = promisify(stream.pipeline);
import { writeFile, mkdir } from "fs/promises";

export {mirror, normalizeAddress};

function pause(ms){
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve();
    },ms);
  });
}

function normalizeAddress(address){
  const urlObject = new url.URL(address);
  let cleanTarget = urlObject.href;
  let ext = path.extname(urlObject.pathname);
  if(!ext){
    urlObject.pathname = path.join(urlObject.pathname, 'index.html');
    cleanTarget = urlObject.href;
  }
  return cleanTarget;
}

async function mirror(address, dest, options){
  let rootAddress = address;
  const rootURL = new URL(rootAddress);
  const downloaded = new Set();

  await save(address, dest, options);
  // await save('Saving https://www.urbandictionary.com/author.php?author=Cat%20Pea', dest, options);
  // await save(address, dest, options);
  // await save(address, dest, options);

  async function save(address, dest, options){
    if(downloaded.has(address)) return;
    downloaded.add(address);

    if(url.parse(address).host != rootURL.host){
      console.log(`Skipping ${address}...`);
      return
    }

    //console.log(`Saving ${address}...`);
    if(url.parse(address).hash) return;
    if(url.parse(address).search) throw new Error(`Nope, query strings are not supported in this crawler, it requires a data saource meant for a static conversion: ${url.parse(address).search}`)

    const remoteUrl = url.parse(address).href;
    const localFile = path.join(dest, url.parse(normalizeAddress(address)).pathname);


    await pause(500);

    let ext = path.extname(url.parse(normalizeAddress(address)).pathname);
    if(ext == '.htm') throw new Error('Noopers, no .htm extensions, you need a unifrom data source that uses standard extensions.')

    if(ext == '.html'){
      //console.log(`Downloading: ${remoteUrl} into ${localFile}`);

      const response = await got(remoteUrl);

      const contentType = response.headers['content-type'];
      if(mime.getExtension(contentType) !== 'html') throw new Error('Malformed content type for a .html url');
      await mkdir(path.dirname(localFile), { recursive: true });
      await writeFile(localFile, response.body);
      const $ = cheerio.load(response.body);

      const aList = $('a[href]').map((i, el) => $(el).attr('href') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)

      const scriptList = $('script[src]').map((i, el) => $(el).attr('src') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)

      const linkList = $('link[href]').map((i, el) => $(el).attr('href') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)

      const imgList = $('img[src]').map((i, el) => $(el).attr('src') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)

      for(const urlObject of [ scriptList, linkList, imgList].flat()){
        await save( urlObject.href, dest, options );
      }
       //console.log(linkObjects);

      //
      // $('a[href]').each(async function(i,el){
      //   let link = $(el).attr('href');
      //   let linkObject;
      //
      //   if(link.match(/^https*:\/\//)){
      //     //console.log("OK", link);
      //     linkObject = new url.URL(link);
      //   }else{
      //     //console.log(link, rootURL.origin);
      //     linkObject = new url.URL(link, rootURL.origin);
      //   }


        //
        // //const linkObject = new url.URL(link, );
        // if(linkObject.origin === rootURL.origin){
        //   //console.log(`Saving.... ${linkObject.href}`);
        //     //await save( linkObject.href, dest, options );
        // }else{
        //   // console.log(`Skipping.... ${linkObject.href}`);
        //
        // }

      //});

    }else if(ext == '.css'){
      console.log('ADD CSS SCAN HERE!!!');
      const cssObject = new url.URL(remoteUrl);
      const response = await got(remoteUrl);
      await writeFile(localFile, response.body);
      if(response.body){
        const regex = /url\("(?<resourceUrl>[^"]+)"\)/gm;
        const str = response.body;
        const buffer = [];
        let match;
        while (match = regex.exec(str)) {
          if(match.groups.resourceUrl.startsWith('data:')) continue;
          buffer.push( match.groups.resourceUrl );
        }
        const matches = buffer
        .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
        .filter(urlObject=>urlObject.origin === rootURL.origin)
        for(const urlObject of matches){
          urlObject.pathname = path.join(path.dirname(cssObject.pathname), urlObject.pathname);
          urlObject.search = ''; // used for cache magic
          await save( urlObject.href, dest, options );
        }
      }
      //url\("(?<resourceUrl>[^"]+)"\)

      //bootstrap-icons.woff
    }else{
      console.log(`Downloading: ${remoteUrl} into ${localFile}`);
      await mkdir(path.dirname(localFile), { recursive: true });
      await pipeline( got.stream(remoteUrl), fs.createWriteStream(localFile) );
    }


  }







}







// const extTransform = new Map()
// extTransform.set('jpeg', 'jpg') ;
// extTransform.set('mpga', 'mp3') ;
//
//
// ////////////////////////////

//
// async function mirror(url, dest, options){
//   const response = await save(url, dest, options);
//
// }
//
// async function save(address, dest, options){
//
//   if(address)
//
//   const requestUrl = url.parse(address);
//   const response = await got(requestUrl.href);
//   const safeName = [ getFileName(requestUrl), getExtName(requestUrl, response), ].join('.');
//   console.log(dest);
//   const destination = path.join(dest, getBaseName(requestUrl), safeName);
//   console.log(destination);
// }
//
//
// function getExtName(address, response){
//   const requestUrl = url.parse(address);
//   let fileExt = path.extname(requestUrl.pathname);
//   if(fileExt.startsWith('.')) fileExt = fileExt.substr(1)
//   if(!fileExt){
//     if(response){
//       const contentType = response.headers['content-type'];
//       fileExt = mime.getExtension(contentType);
//       if(extTransform.has(fileExt)) fileExt = extTransform.get(fileExt);
//     }else{
//         throw new Error("Unable to calculate file extension")
//     }
//   }
//   invariant(fileExt, 'Extension is required');
//   return fileExt;
// }
//
// function getFileName(address){
//   const requestUrl = url.parse(address);
//   let fileName = path.basename(requestUrl.pathname, path.extname(requestUrl.pathname));
//   if(fileName == "") fileName = 'index';
//   if(fileName == "/") fileName = 'index';
//   return kebabCase(fileName);
// }
//
// function getBaseName(address){
//   const requestUrl = url.parse(address);
//   getFileName(requestUrl);
//
//
//   let baseName = path.basename(requestUrl.pathname);
//   if(fileName == "") fileName = 'index';
//   if(fileName == "/") fileName = 'index';
//   return kebabCase(fileName);
// }

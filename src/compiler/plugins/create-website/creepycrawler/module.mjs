import path from 'path';
import mime from 'mime';
import got from 'got';
import cheerio from 'cheerio';
import invariant from 'invariant';
import url from 'url';
import kebabCase from 'lodash/kebabCase.js';

import { performance } from 'perf_hooks';

import stream from 'stream';
import {promisify} from 'util';
import fs from 'fs';

import debugContext from 'debug';
const debug = debugContext('crawlwer');
const info = debugContext('crawler-info');

const pipeline = promisify(stream.pipeline);

import { writeFile, mkdir } from "fs/promises";

export default mirror;

async function mirror({address, destination}){

  let rootAddress = address;
  const rootURL = new URL(rootAddress);
  const processed = new Set();
  const downloaded = new Set();

  const startTime = performance.now()
  await crawl({parent: address, address, destination});
  const endTime = performance.now()
  const crawlDuration = (endTime - startTime);
  info(`Crawl took ${crawlDuration} milliseconds (${parseInt(crawlDuration/1000)} seconds), processed ${processed.size} urls, and downloaded ${downloaded.size}.`)

  async function crawl({parent, address, destination}){

    if(alreadyProcessed(address)) return;
    if(alienHost(address)) return;

    if(url.parse(address).hash) return;
    if(url.parse(address).search) throw new Error(`Nope, query strings are not supported in this crawler, it requires a data saource meant for a static conversion: ${url.parse(address).search}`)

    const remoteUrl = url.parse(address).href;
    const localFile = path.join(destination, url.parse(normalizeAddress(address)).pathname);
    const localDirectory = path.dirname(localFile);

    await mkdir(localDirectory, { recursive: true });

    let ext = path.extname(url.parse(normalizeAddress(address)).pathname);
    if(ext == '.htm') throw new Error('Noopers, no .htm extensions, you need a unifrom data source that uses standard extensions.')

    debug(`Downloading: ${remoteUrl} into ${localFile}`);

    if(ext == '.html'){

      let response = await download(address, parent);

      const contentType = response.headers['content-type'];
      if(mime.getExtension(contentType) !== 'html') throw new Error('Malformed content type for a .html url');


      const $ = cheerio.load(response.body);

      // Spidering
      const aList = $('a[href]').map((i, el) => $(el).attr('href') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)
      .map(urlObject=>{ urlObject.hash = ''; return urlObject;}) // not interested in hashes

      const scriptList = $('script[src]').map((i, el) => $(el).attr('src') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)
      .map(urlObject=>{ urlObject.search = ''; return urlObject;}) // used for cache magic, not interested

      const linkList = $('link[href]').map((i, el) => $(el).attr('href') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)
      .map(urlObject=>{ urlObject.search = ''; return urlObject;}) // used for cache magic, not interested

      const imgList = $('img[src]').map((i, el) => $(el).attr('src') ).get()
      .map(link=>link.match(/^https*:\/\//)?(new url.URL(link)):(new url.URL(link, rootURL.origin)))
      .filter(urlObject=>urlObject.origin === rootURL.origin)
      .map(urlObject=>{ urlObject.search = ''; return urlObject;}) // used for cache magic, not interested

      /* Rewriting...
        This is only an issue if we rewrite /poem/99 to poem/99.html,
        but sapper showed that it is OK to just make a 99 folder with index.html?
        NOTE: use if rewriting is ever needed: await writeFile(localFile, $.html());
      */
      await writeFile(localFile, response.body);
      downloaded.add({address, localFile});

      for(const urlObject of [ aList, scriptList, linkList, imgList ].flat()){
        await crawl({ parent: address, address:urlObject.href, destination });
      }


    }else if(ext == '.css'){

      const cssObject = new url.URL(remoteUrl);
      let response = await download(address, parent);

      await writeFile(localFile, response.body);
      downloaded.add({address, localFile});

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
          await crawl({ parent: address, address:urlObject.href, destination });
        }
      }


    }else{
      try {
        await pipeline( got.stream(remoteUrl), fs.createWriteStream(localFile) );
        downloaded.add({address, localFile});
      } catch (error) {

        if (error?.response?.statusCode === 404) {
          console.log(`${error.response.statusCode}: ${address} found on: ${parent}`)
        } else {
        console.log(error)
        }
        process.exit(1);
      }

    }

    //await pause(100);
  }





  async function download(address, parent) {
    let response
    try {
      response = await got(address)
    } catch (error) {

      if (error?.response?.statusCode === 404) {
        console.log(`${error.response.statusCode}: ${address} found on: ${parent}`)
      } else {
      console.log(error)
      }
      process.exit(1);
    }
    return response;
  }


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

  function alreadyProcessed(address){
    if(processed.has(address)){
      // debug(`The address has already been processed ${address}`);
      return true;
    }else{
      // debug(`Previously unseen address ${address}`);
      processed.add(address);
      return false;
    }
  }

  function alienHost(address){
    // debug(`Performing a host check`);
    if(url.parse(address).host === rootURL.host){
      // debug(`Friendly ${address}...`);
      return false;
    }else{
      // debug(`Alien address, skipping ${address}...`);
      return true;
    }
  }


}

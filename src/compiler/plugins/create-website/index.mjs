import debugContext from 'debug';
const debug = debugContext('create-website');

import path from "path";
import { writeFile } from "fs/promises";
import pretty from 'pretty';
import handlebars from 'handlebars';
import portfinder from 'portfinder';

import server from "./server/index.mjs";
import crawler from "./creepycrawler/module.mjs";

export {
  createWebsite,
};

function pause(ms){
  return new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve();
    },ms);
  });
}

async function createWebsite(configuration, destination) {
  debug(`Creating Website`);
  const port = await portfinder.getPortPromise({ port: 3000, stopPort: 7468 });
  const address = `http://127.0.0.1:${port}/`;
  server.on('start', async function(server){
    debug(`server running at: ${address}`);
    //await pause(60*1000);
    await crawler({ address, destination });
    server.close();
    debug('Server closed (stopped)');
    debug(`Website was scraped into: ${configuration.destination}`);
  });
  server.start({port, configuration});
}

async function scraper(port, websiteRoot) {

}

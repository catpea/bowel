import debugContext from 'debug';
const debug = debugContext('create-website');

import path from "path";
import { writeFile } from "fs/promises";
import pretty from 'pretty';
import handlebars from 'handlebars';

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

async function createWebsite(destination, so) {
  debug(`Creating Website`);
  const port = 7468;
  const address = `http://127.0.0.1:${port}/`;
  server.on('start', async function(server){
    debug(`Server running at ${address}`);
    //console.log('Server is waiting 60 seconds...');
    //await pause(60*1000);
    await crawler({ address, destination });
    server.close();
    debug('Server closed (stopped)');
  });

  const configuration = {
    title: 'Cat Pea University',
    //description: 'Home of Furkies Purrkies',
    description: 'Home of Furkies Purrkies and Westland Warrior',
    objects: [
      '/home/meow/Universe/Development/poetry2/dist/furkies-purrkies/furkies-purrkies.json',
      // '/home/meow/Universe/Development/poetry2/dist/westland-warrior/westland-warrior.json'
    ],
    mounts: [
      { mountpoint: '/image', directory: '/home/meow/Universe/Development/poetry2/dist/furkies-purrkies/image', },
      { mountpoint: '/audio', directory: '/home/meow/Universe/Development/poetry2/dist/furkies-purrkies/audio', },
      // { mountpoint: '/image', directory: '/home/meow/Universe/Development/poetry2/dist/westland-warrior/image', },
      // { mountpoint: '/audio', directory: '/home/meow/Universe/Development/poetry2/dist/westland-warrior/audio', },
    ]
  };
  server.start({port, configuration });
  debug(`Website scraped into: ${destination}`);
}

async function scraper(port, websiteRoot) {

}

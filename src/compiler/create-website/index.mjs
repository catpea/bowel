import debugContext from 'debug';
const debug = debugContext('create-website');

import path from "path";
import { writeFile } from "fs/promises";
import pretty from 'pretty';
import handlebars from 'handlebars';

import server from "./server/index.mjs";

export {
  createWebsite,
};

async function createWebsite(baseDirectory, so) {
  debug(`Creating Website`);
  const websiteRoot = path.join(baseDirectory, "website");
  const port = 7467;

  const options = {
    port: 7467
  };

  const instance = server.start(port);


  // await scraper(port, websiteRoot);
  // await server.stop();

  debug(`Website created at: ${websiteRoot}`);
}

async function scraper(port, websiteRoot) {

}

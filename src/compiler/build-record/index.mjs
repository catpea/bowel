import debugContext from 'debug';
const debug = debugContext('build-record');

import { readRecord, contentFile } from "../helpers.mjs";
import { createRecord } from "./create-record/index.mjs";

import path from "path";
import { existsSync, statSync } from "fs";
import { mkdir, writeFile, readFile, copyFile } from "fs/promises";

export {
  buildRecord
};

async function buildRecord(directory) {
  const recordFile = path.join(directory, "cache", "record.json");
  const record = {};
  const cacheValid = await isCacheValid(recordFile, directory);

  if (cacheValid) {
    //console.log(`Valid cache for ${recordFile}`);
    Object.assign(record, await readRecord(recordFile, directory));
  } else {
    console.log(`Invalid cache for ${recordFile}`);
    Object.assign(record, await createRecord(recordFile, directory));
  }

  if(Object.keys(record).length === 0) throw new Error('Returned empty record')

  return record;
}

async function isCacheValid(recordFile, directory) {
  // check if record even exists
  if (!existsSync(recordFile)) return false; // cache is considered invalid;

  // check fragment sources (cache is the master here)
  if ( await isOutdated( path.join(directory, "cache", "content.html"), path.join(directory, await contentFile(directory)) ) ) return false;
  if ( await isOutdated( path.join(directory, "cache", "configuration.json"), path.join(directory, "configuration.json") ) ) return false;

  // // check fragments
  if ( await isOutdated( recordFile, path.join(directory, "cache", "configuration.json") ) ) return false;
  if ( await isOutdated(recordFile, path.join(directory, "cache", "content.html")) ) return false; // also considers links.json, images.json, content.txt since they are made out of the html

  // default
  return true;
}


async function isOutdated(master, slave) {
  // if (!existsSync(master))
  // console.log(slave, fs.existsSync(slave));
  if (!existsSync(master)) return true; // yes it is outdated, it does not even exist

  const masterStats = statSync(master);
  const slaveStats = statSync(slave);
  const masterDate = new Date(masterStats.mtime);
  const slaveDate = new Date(slaveStats.mtime);

  if (slaveDate > masterDate) console.log( `isOutdated: outdated (by ${slaveDate - masterDate} ms) file found: ${path.relative(path.resolve('.'), master)} (${masterDate}) is outdated becasue ${path.relative(path.resolve('.'), slave)} (${slaveDate}) has changed.` );
  if (slaveDate > masterDate) return true; // the master is outdated;

}

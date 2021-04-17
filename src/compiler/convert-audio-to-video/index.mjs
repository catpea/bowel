import debugContext from 'debug';
const debug = debugContext('convert-audio-to-video');

import path from "path";
import { utimesSync } from "fs";

import util from 'util';
import child_process from 'child_process';
const execFile = util.promisify(child_process.execFile);

import { shouldRecompile } from "../helpers.mjs";

export {
  convertAudioToVideo,
};

async function convertAudioToVideo(dataDirectory, entry) {
  if(!entry.audio) return; // sometimes things don't have an audio version
  const filesDirectory = path.join(dataDirectory, "files");
  const cacheDirectory = path.join(dataDirectory, "cache");
  const sourceFile = path.join(filesDirectory, entry.audio);
  const destinationFile = path.join(cacheDirectory, path.basename(entry.audio, '.mp3') + '.mp4');

  if(await shouldRecompile(destinationFile, sourceFile)){
    const command = 'ffmpeg';
    const commandArguments = [
       '-hide_banner',
       //'-loglevel',
       //'panic',
       '-y',
       '-i',
       'SOURCE',
       '-filter_complex',
       '[0:a]showspectrum=s=1280x760:slide=scroll:mode=separate:color=rainbow:scale=5thrt:win_func=sine:orientation=horizontal:legend=true,format=yuv420p,crop=1562:878:0:0,split=4[a][b][c][d],[a]waveform[aa],[b][aa]vstack[V],[c]waveform=m=0[cc],[d]vectorscope=color4[dd],[cc][dd]vstack[V2],[V][V2]hstack[v]',
       '-map',
       '[v]',
       '-map',
       '0:a',
       'DESTINATION',
    ]
    .map(i=>i==='SOURCE'?sourceFile:i)
    .map(i=>i==='DESTINATION'?destinationFile:i);

    // const { stdout } = await execFile(command, commandArguments);
    // if(stdout.trim()) debug(stdout);

    //utimesSync(destinationFile, new Date(), new Date());
    //console.log(`WARNING: compiler/convert-audio-to-video is just touching files, it is not creating the actual videos!!!!!!!`);


  }

  return true;
}

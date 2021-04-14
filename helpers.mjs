import cheerio from "cheerio";
import marked from "marked";
import yaml from "js-yaml";

import handlebars from 'handlebars';
import handlebarsHelpers from 'handlebars-helpers';
var helpers = handlebarsHelpers({
  handlebars: handlebars
});

import pretty from 'pretty';

import fs from "fs";
import path from "path";
import { mkdir, writeFile, copyFile, readdir } from "fs/promises";

import util from 'util';
import child_process from 'child_process';
const execFile = util.promisify(child_process.execFile);

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));

export {
  readRecord,
  isOutdated,
  createRecord,
  contentFile,
  buildRecord,
  isCacheValid,
  textVersion,
  listImages,
  listLinks,
  resizeCoverImage,
  createContactSheetImage,
  convertAudioToVideo,
  copyAudio,
  copyCoverImages,
  copyLocalAssets,
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

async function resizeCoverImage(dataDirectory, entry) {
  for(const image of coverImages){
    const filesDirectory = path.join(dataDirectory, "files");
    const cacheDirectory = path.join(dataDirectory, "cache");
    const sourceFile = path.join(filesDirectory, entry.image);
    const destinationFile = path.join(cacheDirectory, `${image.id}-${entry.image}`);
    if(await shouldRecompile(destinationFile, sourceFile)){
      const commandArguments = image.arguments
      .map(i=>i==='SOURCE'?sourceFile:i)
      .map(i=>i==='DESTINATION'?destinationFile:i);
      const { stdout } = await execFile(image.command, commandArguments);
      //console.log(stdout);
    }
  }
  return true;
}

async function createContactSheetImage(dataDirectory, entry) {
  if(!entry.image) return; // sometimes things don't have an audio version
  //if(!so.contactSheet) return; // be strict

  const filesDirectory = path.join(dataDirectory, "files");
  const cacheDirectory = path.join(dataDirectory, "cache");

  const sourceFiles = [];
  const destinationFile = path.join(cacheDirectory, entry.image);

  // if(await shouldRecompile(destinationFile, sourceFile)){

    let tile = 3;
    if(sourceFiles > 17) tile = 3;
    if(sourceFiles > 25) tile = 4;
    if(sourceFiles > 35) tile = 5;
    if(sourceFiles > 45) tile = 7;
    if(sourceFiles < 9) tile = 2;
    if(sourceFiles < 4) tile = 1;

    const command = 'montage';
    const commandArguments = [
      '-background',
      '#212529',
      'SOURCES',
      '-geometry',
      '320x230',
      '-tile',
      `TILE`,
      'DESTINATION'
     ]
    .map(i=>i==='TILE'?`${tile}x`:i)
    .map(i=>i==='SOURCES'?sourceFiles:i)
    .map(i=>i==='DESTINATION'?destinationFile:i);

    // const { stdout } = await execFile(command, commandArguments);
    // console.log(stdout);
    // fs.utimesSync(destinationFile, new Date(), new Date());

    console.log(command, commandArguments);
  // }

  return true;

  // so.contactSheet

  // const toc = yaml.safeLoad(fs.readFileSync(path.resolve(path.join(options.directory, options.index))));
  // for (let {name, date} of toc) {
  //   const sections = yaml.safeLoad(fs.readFileSync(path.resolve(path.join(options.directory, name, options.index))));
  //
  //   let images = [];
  //   for (let section of sections) {
  //     if(section.type == 'youtube'){
  //       images.push(`docs/images/yid-${section.id}.jpg`);
  //     } else if(section.type == 'image'){
  //       images.push(`docs/images/${section.url}`);
  //     } else if(section.type == 'business'){
  //       images.push(`docs/images/${section.url}`);
  //     }
  //   } // for each section
  //
  //   // console.log(images.length, images);
  //   if(images.length){
  //
  //     let filePath = path.join('docs/images', 'warrior-' + kebabCase(name) + '-cover.jpg')
  //     let coverPath = path.join('docs/images', kebabCase(name) + '-illustration.jpg')
  //
  //     const files = images.filter(i=>'.gif'!==path.extname(i)).map(i=>`"${i}"`).join(" ")
  //
  //     if(!fs.pathExistsSync(filePath)){
  //       console.log(`Creating Cover Image for ${name}`);
  //       // console.log(`montage ${files} ${filePath}`);
  //       let tile = 3;
  //       if(images.length > 17) tile = 3;
  //       if(images.length > 25) tile = 4;
  //       if(images.length > 35) tile = 5;
  //       if(images.length > 45) tile = 7;
  //       if(images.length < 9) tile = 2;
  //       if(images.length < 4) tile = 1;
  //
  //       await execShellCommand(`montage -background '#212529' ${files} -geometry 320x230 -tile ${tile}x ${filePath}`);
  //       //await execShellCommand(`convert -define jpeg:size=1000x1000 ${filePath}  -thumbnail 500x500^ -gravity center -extent 1000x1000 -quality 80 ${coverPath};`);
  //       //break;
  //     }
  //   }
  //
  // } // for each chapter
}

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

    //const { stdout } = await execFile(command, commandArguments);
    //console.log(stdout);
    fs.utimesSync(destinationFile, new Date(), new Date());

    //console.log(command, commandArguments);
  }

  return true;
}

async function copyAudio(dataDirectory, distDirectory, entry) {
  if(!entry.audio) return; // sometimes things don't have an audio version
  const filesDirectory = path.join(dataDirectory, "files");
  const sourceFile = path.join(filesDirectory, entry.audio);
  const destinationFile = path.join(distDirectory, 'audio', entry.audio);
  if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
  return true;
}

async function copyCoverImages(dataDirectory, distDirectory, entry) {
  for(const image of coverImages){
    const filesDirectory = path.join(dataDirectory, "files");
    const cacheDirectory = path.join(dataDirectory, "cache");
    const sourceFile = path.join(cacheDirectory, `${image.id}-${entry.image}`);
    const destinationFile = path.join(distDirectory, 'image', `${image.id}-${entry.image}`);
    if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
  }
}

async function copyLocalAssets(dataDirectory, distDirectory, entry) {
  //NOTE: assets are found in .links
  for (const link of entry.links) {
    if (!link.url.startsWith("http")) {
      const filesDirectory = path.join(dataDirectory, "files");
      const sourceFile = path.join(filesDirectory, path.basename(link.url));
      const destinationDirectory = path.join( distDirectory, path.dirname(link.url) );
      const destinationFile = path.join( destinationDirectory, path.basename(link.url) );
      if(await shouldCopyFile(sourceFile, destinationFile)) await copyFile(sourceFile, destinationFile);
    }
  }
  return true;
}

async function readRecord(target) {
  return JSON.parse(fs.readFileSync(target).toString());
}

async function shouldCopyFile(sourceFile, destinationFile) {
  if (!fs.existsSync(destinationFile)) return true; // yes it is outdated, it does not even exit
  const destinationStats = fs.statSync(destinationFile);
  const sourceStats = fs.statSync(sourceFile);
  const destinationDate = new Date(destinationStats.mtime);
  const sourceDate = new Date(sourceStats.mtime);
  if (sourceDate > destinationDate)
    console.log(
      `Outdated file found: ${destinationFile} (${destinationDate}) is outdated becasue ${sourceFile} (${sourceDate}) has changed.`
    );
  if (sourceDate > destinationDate) return true; // the destination is outdated;
}

async function shouldRecompile(destinationFile, sourceFile) {
  if (!fs.existsSync(destinationFile)) return true; // yes it is outdated, it does not even exit
  const destinationStats = fs.statSync(destinationFile);
  const sourceStats = fs.statSync(sourceFile);
  const destinationDate = new Date(destinationStats.mtime);
  const sourceDate = new Date(sourceStats.mtime);
  //if (destinationDate <= sourceDate)
  if (sourceDate > destinationDate)
    console.log(
      `Outdated file found (${sourceDate - destinationDate}): ${path.relative(path.resolve('.'), destinationFile)} (${destinationDate}) is outdated becasue ${path.relative(path.resolve('.'), sourceFile)} (${sourceDate}) has changed.`
    );
  if (sourceDate > destinationDate) return true; // the destination is outdated;
}

async function isOutdated(master, slave) {
  // if (!existsSync(master))
  // console.log(slave, fs.existsSync(slave));
  if (!fs.existsSync(master)) return true; // yes it is outdated, it does not even exist

  const masterStats = fs.statSync(master);
  const slaveStats = fs.statSync(slave);
  const masterDate = new Date(masterStats.mtime);
  const slaveDate = new Date(slaveStats.mtime);

  if (slaveDate > masterDate)
    console.log(
      `Outdated file found: ${path.relative(path.resolve('.'), master)} (${masterDate}) is outdated becasue ${path.relative(path.resolve('.'), slave)} (${slaveDate}) has changed.`
    );
  if (slaveDate > masterDate) return true; // the master is outdated;

}

async function createRecord(recordFile, directory) {
  const dataDirectory = directory;
  const cacheDirectory = path.join(dataDirectory, "cache");

  const item = {};
  Object.assign(
    item,
    JSON.parse(
      fs.readFileSync(path.join(directory, "configuration.json")).toString()
    )
  );

  // find html
  let html = "";
  const content = fs.readFileSync(path.join(directory, await contentFile(directory))).toString();
  if (path.extname(await contentFile(directory)) == ".html") {
    html = content;
  } else if (path.extname(await contentFile(directory)) == ".md") {
    html = marked(content);
  } else if (path.extname(await contentFile(directory)) == ".yaml") {
    html = yamlDatabaseToHtml(yaml.load(content));
  }

  // fill in the object
  item.html = html;
  item.text = textVersion(item.html);
  item.images = listImages(item.html);
  item.links = listLinks(item.html);

  const requiredFields = ["title", "date", "image", "audio", "id"];
  const configuration = Object.fromEntries(
    Object.keys(item)
      .filter((i) => requiredFields.includes(i))
      .map((i) => [i, item[i]])
  );

  // content that cache is created from
  await writeFile(
    path.join(dataDirectory, "configuration.json"),
    JSON.stringify(configuration, null, "  ")
  );

  // cache of processed content and options
  await writeFile(
    path.join(cacheDirectory, "configuration.json"),
    JSON.stringify(configuration, null, "  ")
  );
  await writeFile(path.join(cacheDirectory, "content.html"), item.html);
  await writeFile(
    path.join(cacheDirectory, "links.json"),
    JSON.stringify(item.links, null, "  ")
  );
  await writeFile(
    path.join(cacheDirectory, "images.json"),
    JSON.stringify(item.images, null, "  ")
  );
  await writeFile(path.join(cacheDirectory, "content.txt"), item.text);

  // and the item that is made out of cache
  await writeFile(
    path.join(cacheDirectory, "record.json"),
    JSON.stringify(item, null, "  ")
  );
}

async function contentFile(directory) {
  let candidates = [];
  let response = undefined;
  const files = await readdir(directory);
  for await (const file of files) {
    if (file.startsWith("content.")) candidates.push(file);
  }
  response = candidates.pop();
  return response;
}

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
  return record;
}

async function isCacheValid(recordFile, directory) {
  // check if record even exists
  if (!fs.existsSync(recordFile)) return false; // cache is considered invalid;

  // check fragment sources (cache is the master here)
  if (
    await isOutdated(
      path.join(directory, "cache", "content.html"),
      path.join(directory, await contentFile(directory))
    )
  )
    return false;
  if (
    await isOutdated(
      path.join(directory, "cache", "configuration.json"),
      path.join(directory, "configuration.json")
    )
  )
    return false;

  // // check fragments
  if (
    await isOutdated(
      recordFile,
      path.join(directory, "cache", "configuration.json")
    )
  )
    return false;
  if (
    await isOutdated(recordFile, path.join(directory, "cache", "content.html"))
  )
    return false; // also considers links.json, images.json, content.txt since they are made out of the html

  // default
  return true;
}

function textVersion(html) {
  // This is the normalized text version.
  const $ = cheerio.load(html);
  // Destroy paragraphs with links, this is considered a stand-alone link line, a button, data not relevant to an excerpt.
  $("p > a").each(function (index, element) {
    if ($(element).parent().contents().length == 1) $(element).remove();
  });
  // Add texts so that links can be featured in text.
  let links = [];
  $("p > a").each(function (index, element) {
    const name = $(element).text();
    const url = $(element).attr("href");
    links.push({ name, url });
  });
  let text = $("body")
    .text()
    .trim()
    .split("\n")
    .map((i) => i.trim())
    .join("\n")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
  if (links.length)
    text =
      text +
      "\n\n\n" +
      links.map(({ name, url }) => `[${name}]: ${url}`).join("\n");
  return text;
}

function listImages(html) {
  const $ = cheerio.load(html);
  const list = $("img")
    .map(function (i, el) {
      return {
        title: $(this).attr("title") || $(this).attr("alt"),
        url: $(this)
          .attr("src")
          .replace(/^\/image\/[a-z]{2}-/, ""),
      };
    })
    .get();
  return list;
}

function listLinks(html) {
  const $ = cheerio.load(html);
  const list = $("a")
    .map(function (i, el) {
      //console.log($(el).html());
      return {
        title: $(this).attr("title") || $(this).text(),
        url: $(this).attr("href"),
      };
    })
    .get()
    .map((i) => {
      i.hostname = "local";
      try {
        i.hostname = new URL(i.url).hostname;
      } catch (e) {
        // borked.
      }
      return i;
    });
  return list;
}

function yamlDatabaseToHtml(content){

  const htmlTemplate = `
  {{#is this.type 'quote'}}
    <div class="section">
      <header>
        <h2>Quote {{#if author}}by {{author}}{{/if}}</h2>
      </header>
      <blockquote>
        {{{text}}}
        <footer>
          {{#if url}}
            <cite title="{{author}}"><a href="{{url}}">{{author}}</a></cite>
          {{/if}}
          {{#unless url}}
            <cite title="{{author}}">{{author}}</cite>
          {{/unless}}
        </footer>
      </blockquote>
    </div>
  {{/is}}

  {{#is this.type 'youtube'}}
    <div class="section yt">
      <header>
        <h2>{{title}}</h2>
      </header>
      <figure>
        <a href="https://www.youtube.com/watch?v={{id}}" class="no-tufte-underline" title="{{title}}">
          <img src="image/yid-{{id}}.jpg" alt="{{title}}" style="width: 100%; height: auto;">
        </a>
        <figcaption>{{title}}</figcaption>
      </figure>
      <p><a href="https://www.youtube.com/watch?v={{id}}" title="{{title}}">Play Video</a></p>
    </div>
  {{/is}}

  {{#is this.type 'text'}}
    <div class="section">
      <header>
        <h2>{{title}}</h2>
      </header>
      {{{text}}}
    </div>
  {{/is}}

  {{#is this.type 'poem'}}
    <div class="section">
      <header>
        <h2>{{title}}</h2>
        <h3>{{author}}</h3>
      </header>
      {{{text}}}
    </div>
  {{/is}}


  {{#is this.type 'image'}}
  <div class="section">
    <header>
      <h2>{{title}}</h2>
    </header>
      <figure>
        <img src="image/{{url}}" alt="{{title}}" style="width: 100%; height: auto;">
      </figure>
      {{{text}}}
  </div>
  {{/is}}

  {{#is this.type 'subtitle'}}
    <div class="section">
      <header>
        <h2>{{title}}</h2>
      </header>
    </div>
  {{/is}}

  {{#is this.type 'link'}}
    <div class="section">
      <header>
        <h2>{{title}}</h2>
      </header>
      <p>
        <a href="{{url}}">{{title}} &raquo;</a>
      </p>
    </div>
  {{/is}}

  {{#is this.type 'business'}}
    <div class="section">
      <header>
        <h2>Business Practice: {{title}}</h2>
      </header>
      <figure>
        <img src="image/{{url}}" alt="{{title}}" style="width: 100%; height: auto;">
      </figure>
      {{{text}}}
    </div>
  {{/is}}
  `;
  let html = "";
  const template = handlebars.compile(htmlTemplate);
  for( let element of content ) html += template(element);
  html = pretty(html, {ocd: true});
  return html;
}

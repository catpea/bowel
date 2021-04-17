import debugContext from 'debug';
const debug = debugContext('create-record');

import cheerio from "cheerio";

import marked from "marked";
import markedCustom from "marked";
const markedRenderer = { paragraph(text) { return `<div class="section">\n${text.split('\n').map(s=>`<p>${s}</p>`).join('\n')}\n</div>\n`; } };
markedCustom.use({ renderer: markedRenderer });

import yaml from "js-yaml";

import handlebars from 'handlebars';
import handlebarsHelpers from 'handlebars-helpers';
var helpers = handlebarsHelpers({
  handlebars: handlebars
});

import pretty from 'pretty';

import { contentFile } from "../../helpers.mjs";
import path from "path";
import { writeFile, readFile, } from "fs/promises";

export {
  createRecord
};

async function createRecord(recordFile, directory) {
  const dataDirectory = directory;
  const cacheDirectory = path.join(dataDirectory, "cache");

  const item = {};
  Object.assign( item, JSON.parse( (await readFile(path.join(directory, "configuration.json"))).toString() ) );

  // find html
  let html = "";

  const contentFilename = await contentFile(directory);
  debug(`Content filename for ${item.id} is: ${contentFilename}`);
  const content = (await readFile(path.join(directory, contentFilename))).toString();

  if (path.extname(contentFilename) == ".html") {
    html = content;
  } else if (path.extname(contentFilename) == ".md") {
    html = markedCustom(content);
  } else if (path.extname(contentFilename) == ".yaml") {
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

  debug(`Creating record cache for: ${item.id}`)
  // content that cache is created from
  await writeFile( path.join(dataDirectory, "configuration.json"), JSON.stringify(configuration, null, "  ") );

  // cache of processed content and options
  await writeFile( path.join(cacheDirectory, "configuration.json"), JSON.stringify(configuration, null, "  ") );
  await writeFile(path.join(cacheDirectory, "content.html"), item.html);
  await writeFile( path.join(cacheDirectory, "links.json"), JSON.stringify(item.links, null, "  ") );
  await writeFile( path.join(cacheDirectory, "images.json"), JSON.stringify(item.images, null, "  ") );
  await writeFile(path.join(cacheDirectory, "content.txt"), item.text);

  // if (path.extname(contentFilename) == ".yaml") {
  //   if (item.id == "westland-warrior-foreword") {
  //     console.log(listLinks(item.html));
  //     process.exit()
  //   }
  // }

  // and the item that is made out of cache
  const recordFileLocation = path.join(cacheDirectory, "record.json");
  await writeFile( recordFileLocation, JSON.stringify(item, null, "  ") );
  debug(`The ${item.id} record was created at: ${item.id}`)

  return item;
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
          <img src="image/yid-{{id}}.jpg" alt="{{title}}">
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
        <img src="image/{{url}}" alt="{{title}}">
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
        <img src="image/{{url}}" alt="{{title}}">
      </figure>
      {{{text}}}
    </div>
  {{/is}}
  `;
  let html = "";
  const template = handlebars.compile(htmlTemplate);

  for( let element of content ){
    if(element.text) element.text = marked(element.text);
    html += template(element);
  }

  html = pretty(html, {ocd: true});
  return html;
}

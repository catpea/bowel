import path from 'path';
import mime from 'mime';
import got from 'got';
import cheerio from 'cheerio';
import url from 'url';
import kebabCase from 'lodash/kebabCase.js';


export default mirror;

async function mirror(url, dest, options){
  const response = await save(url);

}

async function save(address, dest, options){

  const requestUrl = url.parse(address);
  const response = await got(requestUrl.href);
  const contentType = response.headers['content-type'];
  const fileExt = mime.getExtension(contentType);
  const fileName = path.basename(requestUrl.pathname, path.extname(requestUrl.pathname));
  const safeName = [kebabCase(fileName), fileExt].join('.');


  console.log(safeName);

}

import fs from 'fs';
import path from 'path';
import lodash from 'lodash';
import moment from 'moment';
import rnd from 'random-inclusive';


export default function(options){
  const response = {
    ...loadMeta(options), // meta data about the books within
    ...loadAll(options), // merged into one for home page
    ...loadEach(options), // each json file gets its own object
  };
  return response;
}

function loadMeta(options){
  const books = options.objects.sort()
  .map(name => {
    const string = fs.readFileSync( name ).toString()
    const object = JSON.parse(string);
    delete object.data;
    return object;
  })
  return {
    meta:{books}
  };
}
function loadAll(options){
  const response = {};
  const files = options.objects.sort();
  response.all = load(files, options);
  return response;
}
function loadEach(options){
  const response = {};
  const files = options.objects.sort();
  files.forEach((file)=>{
    response[path.basename(file, path.extname(file))] = load([file], options);
  })
  return response;
}

function load(files, options){
  let listOfBooks = files
  .map(location => fs.readFileSync(location).toString())
  .map(string => JSON.parse(string))
  .flat();
  makePostDataMoreUseful(listOfBooks);
  return {
    story: storySort(listOfBooks, options),
    latest: latestSort(listOfBooks, options),
  }
}
function makePostDataMoreUseful(listOfBooks){
  listOfBooks.forEach(book=>{
    book.data.forEach((entry,index)=>{
        entry.number = index+1;
        entry.bookName = book.name;
        entry.bookTitle = book.title;
        entry.timestamp = moment(entry.date).format('dddd, MMMM Do YYYY, h:mm:ss a');
        entry.text = lodash.truncate(entry.text, {'length': 512, 'separator': /,? +/ });
    })
  })
}
function storySort(listOfBooks, options){
  const posts = lodash.cloneDeep(listOfBooks).map(book=>book.data).flat();
  return storyPagination(posts, options);
}
function latestSort(listOfBooks, options){
  const posts = lodash.cloneDeep(listOfBooks).map(book=>[].concat(book.data).reverse()).flat();
  return latestPagination(posts, options);
}
function storyPagination(posts, options){

  // apply post counter
  posts.forEach((o,i)=>{
    o.postCounter = i;
  })

  // post navigation
  posts.forEach((o,i)=>{
    o.postOlder = (o.postCounter-1<0?(posts.length-1):o.postCounter-1);
    o.postNewer = (o.postCounter+1>(posts.length-1)?0:o.postCounter+1);
    o.postFirst = i===0?true:false;
    o.postLast = i===(posts.length-1)?true:false;
  })

  // page navigation
  const pages = lodash.chunk(posts, options.limit)
  pages.forEach((p,j)=>{
    p.forEach((o,i)=>{
      o.pageCounter = j;
    })
  })

  posts.forEach((o,i)=>{
    o.pageNewer = (o.pageCounter+1>(pages.length-1)?0:o.pageCounter+1);
    o.pageOlder = (o.pageCounter-1<0?(pages.length-1):o.pageCounter-1);
    o.pageFirst = o.pageCounter===0?true:false;
    o.pageLast = o.pageCounter===(pages.length-1)?true:false;
  })

  return {posts, pages};
}
function latestPagination(posts, options){

  posts.sort(function(a,b){
    return new Date(b.date) - new Date(a.date);
  });

  // apply post counter
  posts.forEach((o,i)=>{
    o.postCounter = ((posts.length-1) -i);
  })

  // post navigation
  posts.forEach((o,i)=>{
    o.postOlder = (o.postCounter-1<0?(posts.length-1):o.postCounter-1);
    o.postNewer = (o.postCounter+1>(posts.length-1)?0:o.postCounter+1);
    o.postFirst = i===0?true:false;
    o.postLast = i===(posts.length-1)?true:false;
  })

  // page navigation
  const pages = lodash.chunk(posts, options.limit)
  pages.forEach((p,j)=>{
    p.forEach((o,i)=>{
      o.pageCounter = ((pages.length-1) -j);
    })
  })

  posts.forEach((o,i)=>{
    o.pageNewer = (o.pageCounter+1>(pages.length-1)?0:o.pageCounter+1);
    o.pageOlder = (o.pageCounter-1<0?(pages.length-1):o.pageCounter-1);
    o.pageFirst = o.pageCounter===(pages.length-1)?true:false;
    o.pageLast = o.pageCounter===0?true:false;
  })

  return {posts, pages};
}

#!/usr/bin/env -S node --experimental-modules

// TODO: splice components from catpea/cataclysm
import cheerio from 'cheerio';


// TODO plugins for reading writing files.


// NOTE ADD: a component loader that pulls in files from a well arranged snippet librady

const $ = cheerio.load('<h2 class="title">Hello world</h2>')

$('h2.title').text('Hello there!')

$('h2').addClass('welcome')

$.html()

// I would like to see
// $.import('./file.html') or  $.include('./file.html')
// $.save('./file.html')


// concept of a project that is output to /dist/project-name

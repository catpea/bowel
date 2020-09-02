#!/usr/bin/env -S node --experimental-modules

// TODO: splice components from catpea/cataclysm
import cheerio from 'cheerio';


// TODO pligins for reading writing files.


const $ = cheerio.load('<h2 class="title">Hello world</h2>')

$('h2.title').text('Hello there!')

$('h2').addClass('welcome')

$.html()

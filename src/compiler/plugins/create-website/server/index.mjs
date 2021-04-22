#!/usr/bin/env -S node --experimental-modules

import fs from 'fs'
import path from 'path'
import EventEmitter from 'events';

import cheerio from 'cheerio'
import lodash from 'lodash'
import pct from 'calculate-percent'

import Koa from 'koa'

import koaRouter from '@koa/router'
import koaBody from 'koa-body'
import serve from 'koa-static'
import mount from 'koa-mount'
import logger from 'koa-logger'

import render from './lib/render.mjs'
import datasource from './lib/datasource.mjs'

import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));


class MyEmitter extends EventEmitter {
  start(options){
    return boot(options);
  }
}
const myEmitter = new MyEmitter();
export default myEmitter;

async function boot({port, configuration}) {
  const app = new Koa()

  app.use(async (ctx, next) => {
    ctx.state.title = 'Cat Pea University'
    ctx.state.description = 'Home of Furkies Purrkies and Westland Warrior'
    await next()
  })

  app.use(serve(path.join(__dirname, 'static')));

  for( const { mountpoint, directory } of configuration.mounts ){
    app.use(mount(mountpoint, serve(directory)));
  }

  const router = koaRouter()

  const options = {
    debug: true,
    objects: configuration.objects,
    limit: 14,
  }

  const data = datasource(options)
  app.use(render)
  app.use(koaBody())

  router
    .get('/', index)
    .get('/book/:name/toc/:order', toc)
    .get('/book/:name/:order/read/:counter', book)
    .get('/book/:name/:order/page/:page', book)
    .get('/book/:name/:order', book)

    .get('/browse/:page', index)
    .get('/read/:name/:counter', read)
    .get('/print/:name/:counter', print)
    .get('/sitemap', sitemap)
    .get('/list', list)

  app.use(router.routes())

  async function index(ctx) {
    const { pages, posts } = data.all.latest
    const pageNumber = ctx.params.page ? parseInt(ctx.params.page) : pages.length - 1
    const selected = lodash.filter(posts, { pageCounter: pageNumber })
    await ctx.render('index', {
      pageName: ctx.state.title,
      pageDescription: ctx.state.description,
      pagination: lodash.last(selected),
      books: data.meta.books,
      posts: selected,
    })
  }

  async function book(ctx) {
    const meta = data.meta.books.filter((o) => o.name === ctx.params.name).pop()
    const order = ctx.params.order ? ctx.params.order : meta.order
    const { pages, posts } = data[ctx.params.name][order]
    const pageNumber = ctx.params.page ? parseInt(ctx.params.page) : order == 'story' ? 0 : pages.length - 1
    const selected = lodash.filter(posts, { pageCounter: pageNumber })
    await ctx.render('book', {
      bookName: meta.name,
      bookTitle: meta.title,
      pageName: `${meta.title}: ${meta.subtitle}`,
      pageDescription: `${meta.description}`,
      currentSort: order,
      defaultSort: meta.order, // default
      pagination: lodash.last(selected),
      books: data.meta.books,
      posts: selected,
    })
  }

  async function read(ctx) {
    const meta = data.meta.books.filter((o) => o.name === ctx.params.name).pop()
    const order = ctx.params.order ? ctx.params.order : meta.order
    const { pages, posts } = data[ctx.params.name][order]
    const post = lodash.find(posts, function (o) {
      return o.number == parseInt(ctx.params.counter)
    })
    if (!post) ctx.throw(404, 'invalid post id')
    await ctx.render('read', {
      pageName: post.title,
      pageDescription: `${meta.title}: ${meta.description}`,
      books: data.meta.books,
      post,
    })
  }

  async function print(ctx) {
    const meta = data.meta.books.filter((o) => o.name === ctx.params.name).pop()
    const order = ctx.params.order ? ctx.params.order : meta.order
    const { pages, posts } = data[ctx.params.name][order]
    const post = lodash.find(posts, function (o) {
      return o.number == parseInt(ctx.params.counter)
    })
    if (!post) ctx.throw(404, 'invalid post id')
    await ctx.render('print', {
      pageName: post.title,
      pageDescription: `${meta.title}: ${meta.description}`,
      books: data.meta.books,
      post,
    })
  }

  async function toc(ctx) {
    const meta = data.meta.books.filter((o) => o.name === ctx.params.name).pop()
    const order = ctx.params.order ? ctx.params.order : meta.order
    const { pages, posts } = data[ctx.params.name][order]
    await ctx.render('toc', {
      bookName: meta.name,
      bookTitle: meta.title,
      pageName: `${meta.title}: ${meta.subtitle}`,
      pageDescription: `${meta.description}`,
      currentSort: order,
      defaultSort: meta.order, // default
      books: data.meta.books,
      posts,
    })
  }

  async function sitemap(ctx) {
    await ctx.render('sitemap', {
      books: data.meta.books,
      data,
    })
  }

  async function list(ctx) {
    await ctx.render('list', {
      books: data.meta.books,
      posts: data.all.posts,
    })
  }


  // class MyEmitter extends EventEmitter {}
  // const myEmitter = new MyEmitter();
  let server = app.listen(port);
  myEmitter.emit('start', server);
  // return myEmitter;
}

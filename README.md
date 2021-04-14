# bowel
Bowel is a small and lightweight scaffolding and build system.
Bowel compiles and decompiles server objects used for generating static websites.
Bowel exists because converting user friendly data into a JSON format should be simple and fast.

Somehow, we ended up in an age where a Raspberry PI is enough to take care of all our needs,
it is difficult to justify using a full laptop or desktop just to publish a website.

The old is new again, some parts of the world are still waiting for computers to get fast enough to run massive Java codebases, but that was always a pipe dream.
If a $50 computer can do the job, you write faster software to eliminate the code bloat, you do not wait for faster computers to run your code faster, that will always hold you back.

# TODO


- [ ] Standardize html from md and yaml, but create a bootstrap variant here, just well written html.
- [ ] Convert standard HTML to bootstrap formatting using cheerio
- [ ] Create an Apache like "Index Of" for poems that will double as a website mirror.
- [ ] Add the Audiobook compiler, and remember that it just concatetantes files so it is very fast.
- [ ] Templating system, that us used for a "Add New Post", this may need to be a commander based CLI rather than a menu.

## Urgent!

- [ ] Copy audio extras, a merge system/forlder may need to be required for this, otherwise wget will not mirror files
- [ ] Adapt server to import the extended v2 dist folder, server uses a shell script to copy those files, easy fix.

## Refactoring

- [ ] There need to be two decompilers one for v1 format and the second for v2.
- [x] Tag server objects with a format: 'v1'/'v2' markers to automaticaly tell them apart.
- [ ] Divide code for compiler and recompiler, they should live in separate files.

## Nice To have

- [ ] Health monitoring system, review each record with a unit test

# Notes

2.0.0 represents breaking changes.
1.x (the reference implementation) was never published publicly (as a stand-alone program).

# Strategy

The content repository is created ONCE, with the -d flag,
in that moment what you have is the new content leader.

Only when the content.html changes, will there be a re-calculation,
if you never touch(1) the content.html, then it will never be re-compiled.

# Usage

## Importing a non-narrated resource

```shell

bowel --decompile ~/Universe/Development/warrior/dist/server-object/westland-warrior.json --image-dir ~/Universe/Development/warrior/docs/images/

```

## Importing a narrated resource featuring local web assets

```shell

bowel --decompile ~/Universe/Development/poetry/dist/server-object/furkies-purrkies.json --image-dir ~/Universe/Development/poetry/src/image/ --audio-dir ~/Universe/Development/poetry/src/audio/ --web-dir ~/Universe/Development/poetry/docs/ --release-dir ~/Universe/Development/poetry/dist/


```

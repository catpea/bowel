# bowel
Bowel is a small and lightweight scaffolding and build system.
Bowel compiles and decompiles server objects used for generating static websites.
Bowel exists because converting user friendly data into a JSON format should be simple and fast.

Somehow, we ended up in an age where a Raspberry PI is enough to take care of all our needs,
it is difficult to justify using a full laptop or desktop just to publish a website.

The old is new again, some parts of the world are still waiting for computers to get fast enough to run massive Java codebases, but that was always a pipe dream.
If a $50 computer can do the job, you write faster software to eliminate the code bloat, you do not wait for faster computers to run your code faster, that will always hold you back.

# TODO

## Primary
- [ ] Internalize the server/wget build system, use the server in a sub module mode, and then shell out the wget.

## Potential
- [ ] check for indexes that point to removed record-directories and remove them (put use the trash bin, not rimraf)
- [ ] Add fallback image if record is missing an image (poetry-cover.jpg)
- [ ] Should record injection (add new post) be internalized?
- [ ] More Exports
  - [ ] compiler/convert-audio-to-video is just touching files, it is not creating the videos, fix it when this program goes live
- [ ] v2
  - [ ] Adapt catpea/server to import the extended v2 dist folder, server uses a shell script to copy those files, easy fix.
  - [ ] v2 decompiler (this is for later when this program is in use)

# Audio Book
- [ ] Add the Audiobook compiler, and remember that it just concatetantes files so it is very fast.
- [ ] Add Cover Image    
- [ ] Setup With Amazon

# Done
- [x] Add print field
- [x] Convert standard HTML to bootstrap formatting using cheerio. This needs cards, should this happen in the server?
- [x] Copy audio extras, and dependencies... dependencies.json?
- [x] Image credit is missing in bowel and server-objects, this only applies to poetry.
- [x] Add YouTube video thumbnail downloader to the compiler.
- [x] Create an Apache like "Index Of" for poems that will double as a website mirror.
- [x] Failure to detect links in yaml database
- [x] Warrior is missing images.
- [x] Warrior is missing the audio linked in the introduction poem
- [x] Remove unused yid-* files to force a new download and thus timestamp, to signal cover image rebuild.
- [x] There need to be two decompilers one for v1 format and the second for v2.
- [x] v1 decompiler
- [x] Tag server objects with a format: 'v1'/'v2' markers to automaticaly tell them apart.
- [x] Divide code for compiler and recompiler, they should live in separate files.
- [x] HTML
  - [x] Standardize html from md and yaml, but do not create a bootstrap variant here, just well written html.
    - [x] YAML Database is already standardized witht the HTML template
    - [x] Existing poetry is in .section/p format and this is acceptable
    - [x] Markdown format needs .section class (in md \n is ignored this is great! it makes a p in content html, but is easily readable in content.md state)
- [x] Add New
  - [x] A sophisticated template system, that us used for a "Add New Post", this may need to be a commander based CLI rather than a menu.

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

# Importing Examples

bowel decompile ../warrior/dist/server-object/westland-warrior.json --dist-dir ../warrior/dist/ --web-dir ../warrior/docs/ --yaml-db ../warrior/db/


bowel decompile ~/Universe/Development/poetry/dist/server-object/furkies-purrkies.json --image-dir ~/Universe/Development/poetry/src/image/ --audio-dir ~/Universe/Development/poetry/src/audio/ --web-dir ~/Universe/Development/poetry/docs/ --release-dir ~/Universe/Development/poetry/dist/

# Adding New Records

bowel create html furkies-purrkies
bowel create md furkies-purrkies
bowel create --name the-welder yaml westland-warrior

env DEBUG=* bowel create html furkies-purrkies
env DEBUG=* bowel create md furkies-purrkies
env DEBUG=* bowel create --name the-welder yaml westland-warrior

# Compilation Examples

bowel compile ./westland-warrior;
bowel compile ./furkies-purrkies;

env DEBUG=* bowel compile ./westland-warrior;
env DEBUG=* bowel compile ./furkies-purrkies;


```

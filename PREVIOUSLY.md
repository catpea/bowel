# bowel
Bowel is a small and lightweight scaffolding and build system.
Bowel compiles and decompiles server objects used for generating static websites.
Bowel exists because converting user friendly data into a JSON format should be simple and fast.

Somehow, we ended up in an age where a Raspberry PI is enough to take care of all our needs,
it is difficult to justify using a full laptop or desktop just to publish a website.

The old is new again, some parts of the world are still waiting for computers to get fast enough to run massive Java codebases, but that was always a pipe dream.
If a $50 computer can do the job, you write faster software to eliminate the code bloat, you do not wait for faster computers to run your code faster, that will always hold you back.

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

bowel decompile ../warrior/dist/server-object/westland-warrior.json --root-dir ../warrior --dist-dir ../warrior/dist/ --web-dir ../warrior/docs/ --yaml-db ../warrior/db/


clear; bowel decompile ~/Universe/Development/poetry/dist/server-object/furkies-purrkies.json --root-dir ../poetry --image-dir ~/Universe/Development/poetry/src/image/ --audio-dir ~/Universe/Development/poetry/src/audio/ --web-dir ~/Universe/Development/poetry/docs/ --dist-dir ~/Universe/Development/poetry/dist/


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

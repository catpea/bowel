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

bowel --decompile /home/user/Universe/Development/warrior/dist/server-object/westland-warrior.json --image-dir /home/user/Universe/Development/warrior/docs/images/

```

## Importing a narrated resource featuring local web assets

```shell

bowel --decompile /home/user/Universe/Development/poetry/dist/server-object/furkies-purrkies.json --image-dir /home/user/Universe/Development/poetry/src/image/ --audio-dir /home/user/Universe/Development/poetry/src/audio/ --web-dir /home/user/Universe/Development/poetry/docs/


```

# TODO

Support for multiple input formats is required, the system will search for content.* and use the extension to determine which parser to use.

Supported extensions should be html for complex html applications, markdown for poems and things with links, and jade for shorthand html.

This will part with strict formatting rules, unfortunately. I wanted to use HTML for everything but it became to cumbersome for simple text with links, the solution is to use markdown with shorthand links (wiki like links). The price to pay for this convenience is that I will no longer aim for two paragraph separators in a stanza. Perhaps I shall employ a semicolon from now on.

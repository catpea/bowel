# server
Static site generation friendly koa based webserver.

This research aims to show that it is possible to use a koa server to create static websites with a single wget command.
This is a proof of concept approach to search engine and static host friendly website generation.
This system still makes use of koa/express but in such a way that a scrape of the server results in a static host friendly website.

# Theory of Operation

- this repository consumes audio, visual, and object data files from other repositories.
- binary files are copied unchanged
- the object files are JSON, and give a minimal description of a book
- all the resources are combined into a website by running them through a koa serveer
- standard wget is used to dump a mirror of the koa content which is then stored in docs
- docs can be considered the DIST directory, it is named this way for compatibility with github.

This research aims to show that it is possible to use a koa server to create static websites with a single wget command.

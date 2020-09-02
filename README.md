# bowel
Bowel is a small and lightweight scaffolding and build system for rapid assembly of HTML components.

Scaffolding and HTML component/snippet management is a huge problem that requires a very simple and lightweight solution.

HTML composition should be managed through HTML Element aware templating systems, not strings as the case is with handlebars/mustache.

Direct DOM manipulation is tedious, however using jQuery's approach is actually very terse and readable,
this system uses [cheerio](https://www.npmjs.com/package/cheerio) with a few extra functions (cheerio plugins)
that help with reading/creating files.

This system aims to be lightweight, respectful of HTML, string interpolation will use [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax and all the rest is left up to the user.

The first milestone will be creation of an Open Source Theme Template starter for creating Bootstrap Themes.

Due to parsing HTML Elements, interpolating attributes this won't the the fastest templaing/scaffolding system,
but it will be respectful of HTML and encourage keeping a tidy library of snippets.

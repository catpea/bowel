# bowel
Bowel is a small and lightweight scaffolding and build system for rapid assembly of HTML components, templates, and themes.

Scaffolding and HTML component/snippet management is a huge problem that requires a very simple and lightweight solution.

HTML composition should be managed through HTML Element aware templating systems, not strings as the case is with handlebars/mustache.

Direct DOM manipulation is tedious, however using jQuery's approach is actually very terse and readable,
this system uses [cheerio](https://www.npmjs.com/package/cheerio) with a few extra functions (cheerio plugins)
that help with reading/creating files.

This system aims to be lightweight, respectful of HTML, string interpolation will use [template literal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) syntax and all the rest is left up to the user.

The first milestone will be creation of an Open Source Theme Template starter for creating Bootstrap Themes.

Due to parsing HTML Elements, interpolating attributes this won't the the fastest templaing/scaffolding system,
but it will be respectful of HTML and encourage keeping a tidy library of snippets.

## Interactive

Setting up a new project should only take a moment, the tool used in the process should get out of your way.
Run ```bowel``` on the command line answer prompts and begin coding.

## Useful and Helpful

This is a tool to help you get setup and started with HTML as quickly as possible.

--new --name Dragonfly --pages home, styleguide, contact, templates, dashboards --extends bootstrap-5 node-module node-git

There is no time to play with files, you should simply answer a few simple questions and get to it.

## Multiple Inheritance

A project often relies on other projects via multiple inheritance. For example, bootstrap-dashboards will rely bootstrap-theme, bootstrap-5, bootstrap-icons, node-module, git-config-for-node.

All will be initialized into directory root in the sequence specified in configuration.

## Special

What is special about this project is it embrace of editing HTML files. bootstrap-dark for example will scan all the html files, remove all bg-* classes and smartly replace them with bg-dark text-white.

Remember, this is a scaffold tool, user has not yet performed any work on any of the files being created, there is no risk of damage to existing code, once the tool is ran, it removes it self leaving its final transformation to the user.

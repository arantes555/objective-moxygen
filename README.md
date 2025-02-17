# Objective-Moxygen

Objective-Moxygen is a Doxygen XML to Markdown converter for Objective-C developers who want a minimal and beautiful solution for documenting their projects.

Objective-Moxygen is currently used in conjunction with GitBook to generate the API documentation for [Seald](https://docs.seald.io/en/sdk/seald-sdk-ios/).

## Features

* **Multi page output**: Output single or multiple files
* **Internal linking**: Anchors in comments and function definitions are supported
* **Markdown comments**: Markdown in Doxygen comments are rendered
* **Doxygen groups**: Doxygen [grouping](http://www.doxygen.nl/manual/grouping.html) is supported for more organised documentation
* **Custom templates**: Modify the core Markdown templates to add your own flavour
* **Optional index**: Optionally render a top level index

## Usage

1. Add `GENERATE_XML=YES` to your `Doxyfile` first.
2. Run `doxygen` to generate the XML documentation.
3. Install `objective-moxygen` like so: `npm install objective-moxygen -g`.
4. Run `objective-moxygen` providing the folder location of the XML documentation as the first argument ie. `{OUTPUT_DIRECTORY}/xml`.  
  ```
Usage: objective-moxygen [options] <doxygen XML directory>

Options:
  -V, --version          output the version number
  -o, --output <file>    output file, must contain "%s" when using `groups` or `classes` (default: "api.md"/"api_%s.md")
  -g, --groups           output doxygen groups into separate files
  -c, --classes          output doxygen classes into separate files
  -p, --pages            output doxygen pages into separate files
  -n, --noindex          disable generation of the index, ignored with `groups` or `classes`
  -a, --anchors          add anchors to internal links
  -H, --html-anchors     add html anchors to internal links
  --links <link-type>    whether to use slugified titles, or object's refid, as link anchors (default: "title", possible values: "title" or "refid") (default: "title")
  -l, --language <lang>  programming language (default: "objc")
  -t, --templates <dir>  custom templates directory (default: "built-in templates")
  -L, --logfile [file]   output log messages to file, (default: console only, default file name: "objective-moxygen.log")
  -q, --quiet            quiet mode
  -h, --help             output usage information
  ```

## Multi-page Output

Objective-Moxygen supports the doxygen [groups](http://www.doxygen.nl/manual/grouping.html#modules) syntax for generating multi page documentation. Every [\defgroup](http://www.doxygen.nl/manual/commands.html#cmddefgroup) in your source code will be parsed and output into a separate markdown file, with internal reference updated accordingly.

Example:

```
objective-moxygen --anchors --groups --output api-%s.md /path/to/doxygen/xml
```

## Example

To get a feel for how Objective-Moxygen works you can play with the example which is located in the [example](/example) folder. The example contains:

* Documented Objective-C example code
* A `Doxyfile` file (for doxygen 1.8.13)
* Pre-generated XML output in [example/xml](/example/xml)
* Pre-generated output Markdown files in [example/doc](/example/doc)

To fully build the example, follow these steps (once you've installed `doxygen`. See **Development & Contribution**, below):

1. Rebuild the XML: run `doxygen` from within the example folder.
2. Rebuild the Objective-Moxygen output: from within this directory,

```
node bin/objective-moxygen.js --output=example/doc/test.md example/xml
```

## Development & Contribution

You can develop this project as you would any other Node project:

1. Clone this repo.
2. `npm install` from this directory.

This project is tested through integration, by building the `example/`. To quickly test this project:

1. Install `doxygen` (`brew install doxygen`, `choco install doxygen`, for example). Only must be done once per computer.
2. `npm test` from this directory. This will run Doxygen on the `example/` and build the output.

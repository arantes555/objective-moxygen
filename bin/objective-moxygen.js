#!/usr/bin/env node
'use strict'

const logger = require('../src/logger')
const program = require('commander')
const assign = require('object-assign')
const pjson = require('../package.json')
const app = require('../index.js')

program.version(pjson.version)
  .usage('[options] <doxygen XML directory>')
  .option('-o, --output <file>', 'output file, must contain "%s" when using `groups` or `classes` (default: "api.md"/"api_%s.md")', String)
  .option('-g, --groups', 'output doxygen groups into separate files', false)
  .option('-c, --classes', 'output doxygen classes into separate files', false)
  .option('-p, --pages', 'output doxygen pages into separate files', false)
  .option('-n, --noindex', 'disable generation of the index, ignored with `groups` or `classes`', false)
  .option('-a, --anchors', 'add anchors to internal links', false)
  .option('-H, --html-anchors', 'add html anchors to internal links', false)
  .option('--links <link-type>', 'whether to use slugified titles, or object\'s refid, as link anchors (default: "title", possible values: "title" or "refid")', String, 'title')
  .option('-l, --language <lang>', 'programming language', String, 'objc')
  .option('-t, --templates <dir>', 'custom templates directory (default: "built-in templates")', String)
  .option('-L, --logfile [file]', 'output log messages to file, (default: console only, default file name: "objective-moxygen.log")')
  .option('-q, --quiet', 'quiet mode', false)
  .parse(process.argv)

logger.init(program, app.defaultOptions)

if (program.args.length) {
  const options = program.opts()
  app.run(assign({}, app.defaultOptions, {
    directory: program.args[0],
    output: options.output,
    groups: options.groups,
    pages: options.pages,
    classes: options.classes,
    noindex: options.noindex,
    anchors: options.anchors,
    htmlAnchors: options.htmlAnchors,
    links: options.links,
    language: options.language,
    templates: options.templates
  }))
} else {
  program.help()
}

'use strict'

const fs = require('fs')
const log = require('./logger').getLogger()
const path = require('path')
const handlebars = require('handlebars')
const helpers = require('./helpers')

module.exports = {
  // Loaded templates
  templates: {},

  // Load templates from the given directory
  load (templateDirectory) {
    for (const filename of fs.readdirSync(templateDirectory)) {
      const fullname = path.join(templateDirectory, filename)
      this.templates[filename.match(/(.*)\.md$/)[1]] = handlebars.compile(
        fs.readFileSync(fullname, 'utf8'),
        { noEscape: true, strict: true }
      )
    }
  },

  render (compound) {
    let template

    log.verbose('Rendering ' + compound.kind + ' ' + compound.fullname)

    switch (compound.kind) {
      case 'index':
        template = 'index'
        break
      case 'page':
        template = 'page'
        break
      case 'group':
      case 'namespace':
        if (Object.keys(compound.compounds).length === 1 &&
          compound.compounds[Object.keys(compound.compounds)[0]].kind === 'namespace') {
          return undefined
        }
        template = 'namespace'
        break
      case 'class':
      case 'struct':
      case 'interface':
        template = 'class'
        break
      default:
        log.warn('Cannot render ' + compound.kind + ' ' + compound.fullname)
        console.log('Skipping ', compound)
        return undefined
    }

    if (typeof this.templates[template] === 'undefined') {
      throw new Error(`Template "${template}" not found in your templates directory.`)
    }

    return this.templates[template](compound).replace(/(\r\n|\r|\n){3,}/g, '$1\n')
  },

  renderArray (compounds) {
    return compounds.map((compound) => this.render(compound))
  },

  // Register handlebars helpers
  registerHelpers (options) {
    // Escape the code for a table cell.
    handlebars.registerHelper('cell', code => code.replace(/\|/g, '\\|').replace(/\n/g, '<br/>'))

    // Escape the code for a titles.
    handlebars.registerHelper('title', code => code.replace(/\n/g, '<br/>'))

    // Generate an anchor for internal links
    handlebars.registerHelper('anchor', name => helpers.getAnchor(name, options))

    // Give the current language name
    handlebars.registerHelper('language', () => options.language)
  }
}

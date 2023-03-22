'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const log = require('./logger').getLogger()

const rControl = /[\u0000-\u001f]/g
const rSpecial = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’–—<>,.?/]+/g
const rCombining = /[\u0300-\u036F]/g

module.exports = {
  inline (code) {
    if (Array.isArray(code)) {
      let refs
      let s = ''
      let isInline = false
      for (const e of code) {
        refs = e.split(/(\[.*\]\(.*\)|\n|\s{2}\n)/g)
        for (const f of refs) {
          if (f.charAt(0) === '[') {
            // link
            const link = f.match(/\[(.*)\]\((.*)\)/)
            if (link) {
              if (isInline) {
                s += '`'
                isInline = false
              }
              s += '[`' + link[1] + '`](' + link[2] + ')'
            }
          } else if (f === '\n' || f === '  \n') {
            // line break
            if (isInline) {
              s += '`'
              isInline = false
            }
            s += f
          } else if (f) {
            if (!isInline) {
              s += '`'
              isInline = true
            }
            s += f
          }
        }
      }
      return s + (isInline ? '`' : '')
    } else {
      return '`' + code + '`'
    }
  },

  getAnchor (name, options) {
    if (options.anchors) {
      return '{#' + name + '}'
    } else if (options.htmlAnchors) {
      return '<a id="' + name + '"></a>'
    } else {
      return ''
    }
  },

  findParent (compound, kinds) {
    while (compound) {
      if (kinds.includes(compound.kind)) {
        return compound
      }
      compound = compound.parent
    }
  },

  // Replace ref links to point to correct output file if needed
  resolveRefs (content, compound, references, options, filepath) {
    return content.replace(/\{#ref ([^ ]+) #\}/g, (_, refid) => {
      const ref = references[refid]
      let destcompound
      const page = this.findParent(ref, ['page'])

      if (page) {
        if (page.refid !== compound.refid) {
          destcompound = page
        }
      } else if (options.groups) {
        if (!compound.groupid || compound.groupid !== ref.groupid) {
          destcompound = ref
        }
      } else if (options.classes) {
        const dest = this.findParent(ref, ['namespace', 'class', 'struct', 'interface'])
        if (dest && compound.refid !== dest.refid) {
          destcompound = dest
        }
      } else if (compound.kind === 'page') {
        destcompound = compound.parent
      }

      const anchor = options.links === 'refid'
        ? refid
        : ['class', 'struct', 'interface'].includes(ref.kind)
          ? this.slugify(`${ref.kind} \`${ref.name}\``)
          : this.slugify(`\`${ref.name}\``)
      if (destcompound) {
        const destpath = this.compoundPath(destcompound, options)
        const relative = path.relative(path.dirname(filepath), destpath)
        return `${relative}#${anchor}`
      }
      return `#${anchor}`
    })
  },

  compoundPath (compound, options) {
    if (compound.kind === 'page') {
      return path.dirname(options.output) + '/page-' + compound.name + '.md'
    } else if (options.groups) {
      return util.format(options.output, compound.groupname)
    } else if (options.classes) {
      return util.format(options.output, compound.name.replace(/:/g, '-').replace('<', '(').replace('>', ')'))
    } else {
      return options.output
    }
  },

  writeCompound (compound, contents, references, options) {
    const filepath = this.compoundPath(compound, options)
    this.writeFile(
      filepath,
      contents.map((content) => this.resolveRefs(content, compound, references, options, filepath))
    )
  },

  // Write the output file
  writeFile (filepath, contents) {
    log.verbose('Writing: ' + filepath)
    const stream = fs.createWriteStream(filepath)
    stream.once('open', _ => {
      for (const content of contents) {
        if (content) stream.write(content)
      }
      stream.end()
    })
  },

  slugify (str) {
    // Split accented characters into components
    return str.normalize('NFKD')
      // Remove accents
      .replace(rCombining, '')
      // Remove control characters
      .replace(rControl, '')
      // Replace special characters
      .replace(rSpecial, '-')
      // Remove continuous separators
      .replace(/\-{2,}/g, '-')
      // Remove prefixing and trailing separators
      .replace(/^\-+|\-+$/g, '')
      // ensure it doesn't start with a number (#121)
      .replace(/^(\d)/, '_$1')
      // lowercase
      .toLowerCase()
  }
}

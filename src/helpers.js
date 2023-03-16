'use strict'

const fs = require('fs')
const path = require('path')
const util = require('util')
const log = require('./logger').getLogger()

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
  resolveRefs (content, compound, references, options) {
    return content.replace(/\{#ref ([^ ]+) #\}/g, (_, refid) => {
      const ref = references[refid]
      const page = this.findParent(ref, ['page'])

      if (page) {
        if (page.refid === compound.refid) {
          return '#' + refid
        }
        return this.compoundPath(page, options) + '#' + refid
      }

      if (options.groups) {
        if (compound.groupid && compound.groupid === ref.groupid) {
          return '#' + refid
        }
        return this.compoundPath(ref, options) + '#' + refid
      } else if (options.classes) {
        const dest = this.findParent(ref, ['namespace', 'class', 'struct'])
        if (!dest || compound.refid === dest.refid) {
          return '#' + refid
        }
        return this.compoundPath(dest, options) + '#' + refid
      } else {
        if (compound.kind === 'page') {
          return this.compoundPath(compound.parent, options) + '#' + refid
        }
        return '#' + refid
      }
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
    this.writeFile(
      this.compoundPath(compound, options),
      contents.map((content) => this.resolveRefs(content, compound, references, options))
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
  }
}

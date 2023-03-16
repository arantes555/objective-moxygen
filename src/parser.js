'use strict'

const fs = require('fs')
const log = require('./logger').getLogger()
const path = require('path')
const xml2js = require('xml2js')

const Compound = require('./compound')
const helpers = require('./helpers')
const markdown = require('./markdown')

const trim = text => text.replace(/^[\s\t\r\n]+|[\s\t\r\n]+$/g, '')

const toMarkdown = (element, context) => {
  let s = ''
  context = context || []
  switch (typeof element) {
    case 'string':
      s = element
      break

    case 'object':
      if (Array.isArray(element)) {
        for (const value of element) {
          s += toMarkdown(value, context)
        }
      } else {
        // opening the element
        switch (element['#name']) {
          case 'ref':
            return s + markdown.refLink(toMarkdown(element.$$), element.$.refid)
          case '__text__':
            s = element._
            break
          case 'emphasis':
            s = '*'
            break
          case 'bold':
            s = '**'
            break
          case 'parametername':
          case 'computeroutput':
            s = '`'
            break
          case 'parameterlist':
            if (element.$.kind === 'exception') {
              s = '\n#### Exceptions\n'
            } else {
              s = '\n#### Parameters\n'
            }
            break

          case 'parameteritem':
            s = '* '
            break
          case 'programlisting':
            s = '\n```objectivec\n'
            break
          case 'orderedlist':
            context.push(element)
            s = '\n\n'
            break
          case 'itemizedlist':
            s = '\n\n'
            break
          case 'listitem':
            s = (context.length > 0 && context[context.length - 1]['#name'] === 'orderedlist') ? '1. ' : '* '
            break
          case 'sp':
            s = ' '
            break
          case 'heading':
            s = '## '
            break
          case 'xrefsect':
            s += '\n> '
            break
          case 'simplesect':
            if (element.$.kind === 'attention') {
              s = '> '
            } else if (element.$.kind === 'return') {
              s = '\n#### Returns\n'
            } else if (element.$.kind === 'see') {
              s = '**See also**: '
            } else {
              console.assert(element.$.kind + ' not supported.')
            }
            break
          case 'formula':
            s = trim(element._)
            if (s.startsWith('$') && s.endsWith('$')) {
              return s
            } else if (s.startsWith('\\[') && s.endsWith('\\]')) {
              s = trim(s.substring(2, s.length - 2))
            }
            return '\n$$\n' + s + '\n$$\n'
          case 'preformatted':
            s = '\n<pre>'
            break

          case 'sect1':
          case 'sect2':
          case 'sect3':
            context.push(element)
            s = '\n' + helpers.getAnchor(element.$.id, module.exports.parserOptions) + '\n'
            break
          case 'title':
            const level = '#'.repeat(context[context.length - 1]['#name'].slice(-1)) // eslint-disable-line no-case-declarations
            s = '\n#' + level + ' ' + element._ + '\n'
            break

          case 'mdash':
            s = '&mdash;'
            break
          case 'ndash':
            s = '&ndash;'
            break
          case 'linebreak':
            s = '<br/>'
            break

          case 'xreftitle':
          case 'entry':
          case 'row':
          case 'ulink':
          case 'codeline':
          case 'highlight':
          case 'table':
          case 'para':
          case 'parameterdescription':
          case 'parameternamelist':
          case 'xrefdescription':
          case 'verbatim':
          case 'hruler':
          case undefined:
            break

          default:
            console.error(false, element['#name'] + ': not yet supported.')
        }

        // recurse on children elements
        if (element.$$) {
          s += toMarkdown(element.$$, context)
        }

        // closing the element
        switch (element['#name']) {
          case 'parameterlist':
          case 'para':
            s += '\n\n'
            break
          case 'emphasis':
            s += '*'
            break
          case 'bold':
            s += '**'
            break
          case 'parameteritem':
            s += '\n'
            break
          case 'computeroutput':
            s += '`'
            break
          case 'parametername':
            s += '` '
            break
          case 'entry':
            s = markdown.escape.cell(s) + '|'
            break
          case 'programlisting':
            s += '```\n'
            break
          case 'codeline':
            s += '\n'
            break
          case 'ulink':
            s = markdown.link(s, element.$.url)
            break
          case 'orderedlist':
            context.pop()
            s += '\n'
            break
          case 'itemizedlist':
            s += '\n'
            break
          case 'listitem':
            s += '\n'
            break
          case 'xreftitle':
            s += ': '
            break
          case 'preformatted':
            s += '</pre>\n'
            break
          case 'sect1':
          case 'sect2':
          case 'sect3':
            context.pop()
            s += '\n'
            break
          case 'row':
            s = '\n' + markdown.escape.row(s)
            if (element.$$ && element.$$[0].$.thead === 'yes') {
              for (let i = 0; i < element.$$.length; i++) {
                s += (i ? ' | ' : '\n') + '---------'
              }
            }
            break
        }
      }
      break

    default:
      console.assert(false)
  }

  return s
}

const copy = (dest, property, def) => {
  dest[property] = trim(toMarkdown(def[property]))
}

const summary = (dest, def) => {
  // set from briefdescription or first paragraph of detaileddescription
  let summary = trim(toMarkdown(def.briefdescription))
  if (!summary) {
    summary = trim(toMarkdown(def.detaileddescription))
    if (summary) {
      const firstSentence = summary.split('\n', 1)[0] // .split('. ').first;
      if (firstSentence) {
        summary = firstSentence
      }
    }
  }
  dest.summary = summary
}

module.exports = {
  // All references indexed by refid
  references: {},

  // The root compound
  root: new Compound(),

  parseMembers (compound, props, membersdef) {
    // copy all properties
    for (const prop of Object.keys(props)) {
      compound[prop] = props[prop]
    }

    this.references[compound.refid] = compound

    if (membersdef) {
      for (const memberdef of membersdef) {
        const member = { name: memberdef.name[0], parent: compound }
        compound.members.push(member)
        for (const prop of Object.keys(memberdef.$)) {
          member[prop] = memberdef.$[prop]
        }
        this.references[member.refid] = member
      }
    }
  },

  parseMember (member, section, memberdef) {
    log.verbose('Processing member ' + member.kind + ' ' + member.name)
    member.section = section
    copy(member, 'briefdescription', memberdef)
    copy(member, 'detaileddescription', memberdef)
    summary(member, memberdef)

    let m = []
    switch (member.kind) {
      case 'signal':
      case 'slot':
        m = m.concat(['{', member.kind, '} '])
        break

      case 'function':
        m = m.concat(memberdef.$.prot, ' ') // public, private, ...
        if (memberdef.templateparamlist) {
          m.push('template<')
          if (memberdef.templateparamlist.length > 0 && memberdef.templateparamlist.param) {
            for (let argn = 0; argn < memberdef.templateparamlist[0].param.length; argn++) {
              const param = memberdef.templateparamlist[0].param[argn]
              m = m.concat(argn === 0 ? [] : ',')
              m = m.concat([toMarkdown(param.type)])
              m = m.concat(param.declname ? [' ', toMarkdown(param.declname)] : [])
            }
          }
          m.push('>  \n')
        }
        m = m.concat(memberdef.$.inline === 'yes' ? ['inline', ' '] : [])
        m = m.concat(memberdef.$.static === 'yes' ? ['static', ' '] : [])
        m = m.concat(memberdef.$.virt === 'virtual' ? ['virtual', ' '] : [])
        m = m.concat(toMarkdown(memberdef.type), ' ')
        m = m.concat(memberdef.$.explicit === 'yes' ? ['explicit', ' '] : [])
        // m = m.concat(memberdef.name[0]._);
        m = m.concat(markdown.refLink(member.name, member.refid))
        m = m.concat('(')
        if (memberdef.param) {
          for (let argn = 0; argn < memberdef.param.length; argn++) {
            const param = memberdef.param[argn]
            m = m.concat(argn === 0 ? [] : ', ')
            m = m.concat([toMarkdown(param.type)])
            m = m.concat(param.declname ? [' ', toMarkdown(param.declname)] : [])
          }
        }

        m = m.concat(')')
        m = m.concat(memberdef.$.const === 'yes' ? [' ', 'const'] : [])
        m = m.concat(memberdef.argsstring[0]._.match(/noexcept$/) ? ' noexcept' : '')
        m = m.concat(memberdef.argsstring[0]._.match(/=\s*delete$/) ? ' = delete' : '')
        m = m.concat(memberdef.argsstring[0]._.match(/=\s*default/) ? ' = default' : '')
        break

      case 'variable':
        m = m.concat(memberdef.$.prot, ' ') // public, private, ...
        m = m.concat(memberdef.$.static === 'yes' ? ['static', ' '] : [])
        m = m.concat(memberdef.$.mutable === 'yes' ? ['mutable', ' '] : [])
        m = m.concat(toMarkdown(memberdef.type), ' ')
        // m = m.concat(memberdef.name[0]._);
        m = m.concat(markdown.refLink(member.name, member.refid))
        break

      case 'property':
        m = m.concat(['{', member.kind, '} '])
        m = m.concat(toMarkdown(memberdef.type), ' ')
        // m = m.concat(memberdef.name[0]._);
        m = m.concat(markdown.refLink(member.name, member.refid))
        break

      case 'enum':
        member.enumvalue = []
        if (memberdef.enumvalue) {
          for (const param of memberdef.enumvalue) {
            const enumvalue = {}
            copy(enumvalue, 'name', param)
            copy(enumvalue, 'briefdescription', param)
            copy(enumvalue, 'detaileddescription', param)
            summary(enumvalue, param)
            member.enumvalue.push(enumvalue)
          }
        }
        // m.push(member.kind + ' ' + member.name);
        m = m.concat([member.kind, ' ', markdown.refLink(member.name, member.refid)])
        break

      default:
        // m.push(member.kind + ' ' + member.name);
        m = m.concat([member.kind, ' ', markdown.refLink(member.name, member.refid)])
        break
    }

    member.proto = helpers.inline(m)
  },

  assignToNamespace (compound, child) {
    if (compound.name !== child.namespace) { console.assert('namespace mismatch: ', compound.name, '!=', child.namespace) }

    // namespaces take ownership of the child compound
    if (child.parent) { delete child.parent.compounds[child.id] }
    compound.compounds[child.id] = child
    child.parent = compound
  },

  assignNamespaceToGroup (compound, child) {
    // add the namespace to the group
    compound.compounds[child.id] = child

    // remove namespace clildren from direct group children
    for (const id of Object.keys(child.compounds)) {
      delete compound.compounds[id]
    }
  },

  assignClassToGroup (compound, child) {
    // add the namespace to the group
    // if the child already belongs to a child namespace it will be removed
    // on the call to `assignNamespaceToGroup`
    compound.compounds[child.id] = child

    // add a groupid and reference to the compound and all it's members
    child.groupid = compound.id
    child.groupname = compound.name

    for (const member of child.members) {
      member.groupid = compound.id
      member.groupname = compound.name
    }
  },

  extractPageSections (page, elements) {
    for (const element of elements) {
      if (element['#name'] === 'sect1' || element['#name'] === 'sect2' || element['#name'] === 'sect3') {
        const id = element.$.id
        const member = { section: element['#name'], id, name: id, refid: id, parent: page }
        page.members.push(member)
        this.references[member.refid] = member
      }
      if (element.$$) { this.extractPageSections(page, element.$$) }
    }
  },

  parseCompound (compound, compounddef) {
    log.verbose('Processing compound ' + compound.name)
    for (const prop of Object.keys(compounddef.$)) {
      compound[prop] = compounddef.$[prop]
    }
    compound.fullname = compounddef.compoundname[0]._
    copy(compound, 'briefdescription', compounddef)
    copy(compound, 'detaileddescription', compounddef)
    summary(compound, compounddef)

    if (compounddef.basecompoundref) {
      for (const basecompoundref of compounddef.basecompoundref) {
        compound.basecompoundref.push({
          prot: basecompoundref.$.prot,
          name: basecompoundref._
        })
      }
    }

    if (compounddef.sectiondef) {
      for (const section of compounddef.sectiondef) {
        // switch (section.$['kind']) {
        //   case 'define':
        //   case 'enum':
        //   case 'friend':
        //   case 'public-attrib':
        //   case 'public-func':
        //   case 'protected-attrib':
        //   case 'protected-func':
        //   case 'private-attrib':
        //   case 'private-func':
        if (section.memberdef) {
          for (const memberdef of section.memberdef) {
            const member = this.references[memberdef.$.id]

            if (compound.kind === 'group') {
              member.groupid = compound.id
              member.groupname = compound.name
            } else if (compound.kind === 'file') {
              // add free members defined inside files in the default
              // namespace to the root compound
              this.root.members.push(member)
            }
            this.parseMember(member, section.$.kind, memberdef)
          }
        }
        //     break;
        //
        //   default:
        //     console.assert(true);
        // }
      }
    }

    compound.proto = helpers.inline([compound.kind, ' ', markdown.refLink(compound.name, compound.refid)])

    // kind specific parsing
    switch (compound.kind) {
      case 'class':
      case 'struct':
      case 'union':
      case 'typedef':
        // set namespace reference
        const nsp = compound.name.split('::') // eslint-disable-line no-case-declarations
        compound.namespace = nsp.splice(0, nsp.length - 1).join('::')
        break

      case 'file':
        // NOTE: to handle free functions in the default namespace we would
        // parse add all contained members to the root compound.
        break

      case 'page':
        this.extractPageSections(compound, compounddef.$$)
        break

      case 'namespace':
      case 'group':

        if (compound.kind === 'group') {
          compound.groupid = compound.id
          compound.groupname = compound.name
        }

        // handle innerclass for groups and namespaces
        if (compounddef.innerclass) {
          for (const innerclassdef of compounddef.innerclass) {
            if (compound.kind === 'namespace') {
              // log.verbose('Assign ' + innerclassdef.$.refid + ' to namespace ' + compound.name);

              if (this.references[innerclassdef.$.refid]) { this.assignToNamespace(compound, this.references[innerclassdef.$.refid]) }
            } else if (compound.kind === 'group') {
              // log.verbose('Assign ' + innerclassdef.$.refid + ' to group ' + compound.name);
              if (this.references[innerclassdef.$.refid]) { this.assignClassToGroup(compound, this.references[innerclassdef.$.refid]) }
            }
          }
        }

        // handle innernamespace for groups and namespaces
        if (compounddef.innernamespace) {
          compound.innernamespaces = []
          for (const namespacedef of compounddef.innernamespace) {
            if (compound.kind === 'group') {
              // log.verbose('Assign namespace ' + namespacedef.$.refid + ' to group ' + compound.name);
              this.assignNamespaceToGroup(compound, this.references[namespacedef.$.refid])
            }
          }
        }
        break
      default:
        console.assert(true)
    }
  },

  parseIndex (root, index, options) {
    for (const element of index) {
      const compound = root.find(element.$.refid, element.name[0], true)
      const xmlParser = new xml2js.Parser({
        explicitChildren: true,
        preserveChildrenOrder: true,
        charsAsChildren: true
      })

      this.parseMembers(compound, element.$, element.member)

      if (compound.kind !== 'file') { // && compound.kind !== 'file'
        log.verbose('Parsing ' + path.join(options.directory, compound.refid + '.xml'))
        const doxygen = fs.readFileSync(path.join(options.directory, compound.refid + '.xml'), 'utf8')
        xmlParser.parseString(doxygen, (err, data) => {
          if (err) {
            log.verbose('warning - parse error for file: ' + path.join(options.directory, compound.refid + '.xml'))
            return
          }
          this.parseCompound(compound, data.doxygen.compounddef[0])
        })
      }
    }
  },

  loadIndex (options, callback) {
    this.parserOptions = options
    log.verbose('Parsing ' + path.join(options.directory, 'index.xml'))
    fs.readFile(path.join(options.directory, 'index.xml'), 'utf8', (err, data) => {
      if (err) {
        callback(new Error(`Failed to load doxygen XML: ${err.message}`))
        return
      }
      const xmlParser = new xml2js.Parser()
      xmlParser.parseString(data, (err, result) => {
        if (err) {
          callback(new Error(`Failed to parse doxygen XML: ${err.message}`))
          return
        }
        this.root.kind = 'index'
        this.parseIndex(this.root, result.doxygenindex.compound, options)
        callback(null, this.root) // TODO: return errors properly
      })
    })
  }
}

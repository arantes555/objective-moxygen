'use strict'

// const log = require('./logger').getLogger()

class Compound {
  constructor (parent, id, name) {
    this.parent = parent
    this.id = id
    this.name = name
    this.compounds = {}
    this.members = []
    this.basecompoundref = []
    this.filtered = {}
  }

  find (id, name, create) {
    let compound = this.compounds[id]

    if (!compound && create) {
      compound = this.compounds[id] = new Compound(this, id, name)
    }

    return compound
  }

  toArray (type, kind) {
    type = type || 'compounds'
    let arr = Object.keys(this[type]).map((key) => this[type][key])

    if (type === 'compounds') {
      let all = []
      for (const compound of arr) {
        if (!kind || compound.kind === kind) { // compound &&
          all.push(compound)
          all = all.concat(compound.toArray(type, kind))
        }
      }
      arr = all
    }

    return arr
  }

  toFilteredArray (type) {
    type = type || 'compounds'
    let all = []

    if (this.filtered[type]) {
      for (const item of this.filtered[type]) {
        const children = item.toFilteredArray(type)
        all.push(item)
        all = all.concat(children)
      }
    }

    return all
  }

  filterChildren (filters, groupid) {
    for (const compound of this.toArray('compounds')) {
      compound.filtered.members = compound.filter(compound.members, 'section', filters.members, groupid)
      compound.filtered.compounds = compound.filter(compound.compounds, 'kind', filters.compounds, groupid)
    }
    this.filtered.members = this.filter(this.members, 'section', filters.members, groupid)
    this.filtered.compounds = this.filter(this.compounds, 'kind', filters.compounds, groupid)
  }

  filter (collection, key, filter, groupid) {
    const categories = {}
    let result = []

    for (const name of Object.keys(collection)) {
      const item = collection[name]
      if (item) {
        // skip empty namespaces
        if (item.kind === 'namespace') {
          if ((!item.filtered.compounds || !item.filtered.compounds.length) &&
            (!item.filtered.members || !item.filtered.members.length)) {
            // log.verbose('Skip empty namespace: ' + item.name);
            continue
          }
        } else if (groupid && item.groupid !== groupid) { // skip items not belonging to current group
          // log.verbose('Skip item from foreign group: { item.kind: ' + item.kind
          //   + ', item.name: ' + item.name + ', item.groupid: '
          //   + item.groupid + ', group.id: '+ group.id + '}');
          continue
        }

        (categories[item[key]] || (categories[item[key]] = [])).push(item)
      }
    }

    for (const category of filter) {
      result = result.concat(categories[category] || [])
    }

    return result
  }
}

module.exports = Compound

'use strict'

module.exports = {
  refLink (text, refid) {
    return this.link(text, '{#ref ' + refid + ' #}')
  },

  link (text, href) {
    return '[' + text + '](' + href + ')'
  },

  escape: {
    row (text) {
      return text.replace(/\s*\|\s*$/, '')
    },

    /**
     * Escaping for a cell in a table.
     **/
    cell (text) {
      return text.replace(/^[\n]+|[\n]+$/g, '') // trim CRLF
        .replace('/|/g', '\\|') // escape the pipe
        .replace(/\n/g, '<br/>') // escape CRLF
    }
  }
}

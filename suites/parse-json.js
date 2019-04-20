const { Suite } = require('benchmark')
const prettyBytes = require('pretty-bytes')

const allData = require('../data')

module.exports = Object.entries(allData).reduce((suites, [ size, data ]) => ([
  ...suites,
  new Suite(`Parse ${size} JSON string (${prettyBytes(data.asJSONString.length)})`)
    .add('in main thread', () => {
      const parsed = JSON.parse(data.asJSONString)
      if (parsed.length !== data.asArray.length) {
        throw new Error('unexpected result length')
      }
    })
]), [])

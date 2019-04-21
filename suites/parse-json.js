const { Suite } = require('benchmark')
const prettierBytes = require('prettier-bytes')

const allData = require('../data')

module.exports = Object.entries(allData).reduce((suites, [ size, data ]) => {
  const byteSize = data.asJSONString.length
  const times = Math.round((10 * 1024 * 1024) / byteSize)
  const totalSize = times * byteSize

  return [
    ...suites,
    new Suite(`Parse ${prettierBytes(totalSize)} of ${size} ${prettierBytes(byteSize)} JSON strings`)
      .add('in main thread', () => {
        for (let i = 0; i < times; ++i) {
          const parsed = JSON.parse(data.asJSONString)
          if (parsed.length !== data.asArray.length) {
            throw new Error('unexpected result length')
          }
        }
      })
  ]
}, [])

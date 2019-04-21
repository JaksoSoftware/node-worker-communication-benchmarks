const { Worker } = require('worker_threads')
const os = require('os')

const { Suite } = require('benchmark')
const prettierBytes = require('prettier-bytes')

const allData = require('../data')

module.exports = Object.entries(allData).reduce((suites, [ size, data ]) => {
  const byteSize = data.asJSONString.length
  const times = Math.round((10 * 1024 * 1024) / byteSize)
  const totalSize = times * byteSize

  const workers = []

  return [
    ...suites,
    new Suite(`Parse ${prettierBytes(totalSize)} of ${size} ${prettierBytes(byteSize)} JSON strings`)
      .on('start', () => {
        for (let i = 0; i < os.cpus().length; ++i) {
          workers.push(new Worker('./workers/parse-json.js'))
        }
      })
      .add('in main thread, from JSON byte buffer', () => {
        for (let i = 0; i < times; ++i) {
          const parsed = JSON.parse(data.asJSONBuffer)
          verifyResult(parsed)
        }
      })
      .add('in main thread, from JSON string', () => {
        for (let i = 0; i < times; ++i) {
          const parsed = JSON.parse(data.asJSONString)
          verifyResult(parsed)
        }
      })
      .add('in single worker thread, from copied JSON string, one at a time', async deferred => {
        for (let i = 0; i < times; ++i) {
          workers[0].postMessage(data.asJSONString)
          await new Promise(resolve => {
            workers[0].once('message', parsed => {
              verifyResult(parsed)
              resolve()
            })
          })
        }
        deferred.resolve()
      }, { defer: true })
      .add('in single worker thread, from copied JSON string, pipelined', deferred => {
        let repliesReceived = 0

        for (let i = 0; i < times; ++i) {
          workers[0].postMessage(data.asJSONString)
        }
        workers[0].on('message', receiveReply)

        function receiveReply(parsed) {
          verifyResult(parsed)
          if (++repliesReceived === times) {
            workers[0].off('message', receiveReply)
            deferred.resolve()
          }
        }
      }, { defer: true })
      .add('in single worker thread, with JSON in SharedArrayBuffer, pipelined', deferred => {
        let repliesReceived = 0

        for (let i = 0; i < times; ++i) {
          workers[0].postMessage(data.asSharedJSONArray)
        }
        workers[0].on('message', receiveReply)

        function receiveReply(parsed) {
          verifyResult(parsed)
          if (++repliesReceived === times) {
            workers[0].off('message', receiveReply)
            deferred.resolve()
          }
        }
      }, { defer: true })
      .add('spread across threads for each CPU, from copied JSON string, pipelined', deferred => {
        let repliesReceived = 0

        for (let i = 0; i < times; ++i) {
          workers[i % workers.length].postMessage(data.asJSONString)
        }
        workers.forEach(worker => worker.on('message', receiveReply))

        function receiveReply(parsed) {
          verifyResult(parsed)
          if (++repliesReceived === times) {
            workers.forEach(worker => worker.off('message', receiveReply))
            deferred.resolve()
          }
        }
      }, { defer: true })
      .on('complete', () => {
        workers.forEach(worker => worker.unref())
        workers.length = 0
      })
  ]

  function verifyResult(parsed) {
    if (parsed.length !== data.asParsedObjects.length) {
      throw new Error('unexpected result length')
    }
  }
}, [])

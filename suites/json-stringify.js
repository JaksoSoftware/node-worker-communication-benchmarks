const { Worker } = require('worker_threads')
const os = require('os')
const events = require('events')

const { Suite } = require('benchmark')
const prettierBytes = require('prettier-bytes')

const allData = require('../data')
const { callNTimesWithSetImmediate } = require('../utils')
const { countWithin } = require('../utils')

module.exports = Object.entries(allData).map(([ size, data ]) => {
  const byteSize = data.asCompactJSONString.length
  const times = Math.round((10 * 1024 * 1024) / byteSize)
  const totalJsonSize = times * byteSize

  const numArrays = countWithin(data.asParsedObjects, val => val instanceof Array)
  const numObjects = countWithin(data.asParsedObjects, val => !!val && typeof val === 'object' && !(val instanceof Array))

  const workers = []

  return new Suite(`Stringify ${times} values with ${numArrays} arrays and ${numObjects} objects within each to a total of ${prettierBytes(totalJsonSize)} of JSON`)
    .on('start', () => {
      for (let i = 0; i < os.cpus().length; ++i) {
        workers.push(new Worker('./workers/json-stringify.js'))
      }
    })
    .add('in main thread', async deferred => {
      await callNTimesWithSetImmediate(times, () => {
        const resultJson = JSON.stringify(data.asParsedObjects)
        verifyResult(resultJson)
      })
      deferred.resolve()
    }, { defer: true })
    .add('in single worker thread, one at a time', async deferred => {
      for (let i = 0; i < times; ++i) {
        workers[0].postMessage(data.asParsedObjects)
        const [ resultJson ] = await events.once(workers[0], 'message')
        verifyResult(resultJson)
      }
      deferred.resolve()
    }, { defer: true })
    .add('in single worker thread, pipelined', deferred => {
      let repliesReceived = 0
      workers[0].on('message', receiveReply)

      callNTimesWithSetImmediate(times, () => {
        workers[0].postMessage(data.asParsedObjects)
      })

      function receiveReply(resultJson) {
        verifyResult(resultJson)
        if (++repliesReceived === times) {
          workers[0].off('message', receiveReply)
          deferred.resolve()
        }
      }
    }, { defer: true })
    .add('spread across threads for each CPU, pipelined', deferred => {
      let repliesReceived = 0
      workers.forEach(worker => worker.on('message', receiveReply))

      callNTimesWithSetImmediate(times, nCallsRemaining => {
        workers[nCallsRemaining % workers.length].postMessage(data.asParsedObjects)
      })

      function receiveReply(resultJson) {
        verifyResult(resultJson)
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

  function verifyResult(resultJson) {
    const expectedLength = byteSize
    if (resultJson.length !== expectedLength) {
      throw new Error(`unexpected result length ${resultJson.length} !== ${expectedLength}`)
    }
  }
}, [])

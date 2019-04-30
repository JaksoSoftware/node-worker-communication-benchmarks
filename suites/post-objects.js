const { Worker } = require('worker_threads')

const { Suite } = require('benchmark')

const allData = require('../data')
const { callNTimesWithSetImmediate } = require('../utils')
const { countWithin } = require('../utils')

module.exports = Object.entries(allData).map(([ size, data ]) => {
  const byteSize = data.asCompactJSONString.length
  const times = Math.round((10 * 1024 * 1024) / byteSize)

  const numArrays = countWithin(data.asParsedObjects, val => val instanceof Array)
  const numObjects = countWithin(data.asParsedObjects, val => !!val && typeof val === 'object' && !(val instanceof Array))

  let blackHoleWorker = null, objSenderWorker = null

  return new Suite(`postMessage ${times} values with ${numArrays} arrays and ${numObjects} objects within each`)
    .on('start', () => {
      blackHoleWorker = new Worker('./workers/black-hole.js')
      objSenderWorker = new Worker('./workers/send-back-workerdata.js', { workerData: data.asParsedObjects })
    })
    .add('from main to worker thread', deferred => {
      let repliesReceived = 0
      blackHoleWorker.on('message', receiveReply)

      callNTimesWithSetImmediate(times, () => {
        blackHoleWorker.postMessage(data.asParsedObjects)
      })

      function receiveReply() {
        if (++repliesReceived === times) {
          blackHoleWorker.off('message', receiveReply)
          deferred.resolve()
        }
      }
    }, { defer: true })
    .add('from worker to main thread', deferred => {
      let repliesReceived = 0
      objSenderWorker.on('message', receiveReply)

      callNTimesWithSetImmediate(times, () => {
        objSenderWorker.postMessage(null)
      })

      function receiveReply() {
        if (++repliesReceived === times) {
          objSenderWorker.off('message', receiveReply)
          deferred.resolve()
        }
      }
    }, { defer: true })
    .on('complete', () => {
      blackHoleWorker.unref()
      objSenderWorker.unref()
    })
})

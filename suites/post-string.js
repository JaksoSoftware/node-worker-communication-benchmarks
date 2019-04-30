const { Worker } = require('worker_threads')

const { Suite } = require('benchmark')
const prettierBytes = require('prettier-bytes')

const allData = require('../data')
const { callNTimesWithSetImmediate } = require('../utils')

module.exports = Object.entries(allData).map(([ size, data ]) => {
  const byteSize = data.asPrettyJSONString.length
  const times = Math.round((10 * 1024 * 1024) / byteSize)
  const totalSize = times * byteSize

  let blackHoleWorker = null, stringSenderWorker = null

  return new Suite(`postMessage ${prettierBytes(totalSize)} of ${size} ${prettierBytes(byteSize)} JSON strings`)
    .on('start', () => {
      blackHoleWorker = new Worker('./workers/black-hole.js')
      stringSenderWorker = new Worker('./workers/send-back-string.js', { workerData: data.asPrettyJSONString })
    })
    .add('from main to worker thread', deferred => {
      let repliesReceived = 0
      blackHoleWorker.on('message', receiveReply)

      callNTimesWithSetImmediate(times, () => {
        blackHoleWorker.postMessage(data.asPrettyJSONString)
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
      stringSenderWorker.on('message', receiveReply)

      callNTimesWithSetImmediate(times, () => {
        stringSenderWorker.postMessage(null)
      })

      function receiveReply() {
        if (++repliesReceived === times) {
          stringSenderWorker.off('message', receiveReply)
          deferred.resolve()
        }
      }
    }, { defer: true })
    .on('complete', () => {
      blackHoleWorker.unref()
      stringSenderWorker.unref()
    })
})

const { parentPort } = require('worker_threads')

parentPort.on('message', jsonString => {
  parentPort.postMessage(JSON.parse(jsonString))
})

const { parentPort } = require('worker_threads')

parentPort.on('message', () => {
  parentPort.postMessage(null)
})

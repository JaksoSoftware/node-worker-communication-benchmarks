const { parentPort } = require('worker_threads')

parentPort.on('message', input => {
  parentPort.postMessage(JSON.stringify(input))
})

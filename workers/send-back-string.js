const { parentPort, workerData } = require('worker_threads')

parentPort.on('message', () => {
  parentPort.postMessage(workerData)
})

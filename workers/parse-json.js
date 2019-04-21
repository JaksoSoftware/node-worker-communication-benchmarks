const { parentPort } = require('worker_threads')

parentPort.on('message', input => {
  const jsonString = convertToJsonString(input)
  parentPort.postMessage(JSON.parse(jsonString))
})

function convertToJsonString(input) {
  if (typeof input === 'string') {
    return input
  } else if (input instanceof Uint8Array) {
    return Buffer.from(input).toString()
  } else {
    throw new Error('unsupported input type')
  }
}

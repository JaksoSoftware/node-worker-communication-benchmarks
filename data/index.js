const fs = require('fs')
const path = require('path')

module.exports = [
  'small',
  'medium',
  'large',
  'huge'
].reduce((data, name) => {
  const jsonBuffer = fs.readFileSync(path.join(__dirname, `${name}.json`), { encoding: null })

  const sharedArrayBuffer = new SharedArrayBuffer(jsonBuffer.length)
  const sharedByteArray = new Uint8Array(sharedArrayBuffer)
  jsonBuffer.copy(sharedByteArray)

  const asParsedObjects = JSON.parse(jsonBuffer)

  return ({
    ...data,
    [name]: {
      asJSONBuffer: jsonBuffer,
      asPrettyJSONString: jsonBuffer.toString(),
      asCompactJSONString: JSON.stringify(asParsedObjects),
      asSharedJSONArray: sharedByteArray,
      asParsedObjects
    }
  })
}, {})

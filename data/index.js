const fs = require('fs')
const path = require('path')

module.exports = [
  'small',
  'medium',
  'large',
  'huge'
].reduce((data, name) => ({
  ...data,
  [name]: {
    asJSONByteArray: fs.readFileSync(path.join(__dirname, `${name}.json`), { encoding: null }),
    asJSONString: fs.readFileSync(path.join(__dirname, `${name}.json`), { encoding: 'utf-8' }),
    asParsedObjects: require(`./${name}.json`)
  }
}), {})

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
    asJSONString: fs.readFileSync(path.join(__dirname, `${name}.json`)),
    asArray: require(`./${name}.json`)
  }
}), {})

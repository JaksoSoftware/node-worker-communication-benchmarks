const suites = require('./suites')

for (const suite of suites) {
  suite
    .on('start', (event) => {
      console.log(suite.name)
    })
    .on('cycle', event => {
      console.log('  ', String(event.target))
    })
    .on('complete', () => {
      console.log('Fastest is ' + suite.filter('fastest').map('name'))
      console.log('---')
    })
    .run()
}

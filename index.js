const allSuites = require('./suites')

runSuites(allSuites)

function runSuites(suites) {
  if (suites.length > 0) {
    const [suite, ...followingSuites] = suites
    suite
      .on('start', () => {
        console.log(suite.name)
      })
      .on('cycle', event => {
        console.log('  ', String(event.target))
      })
      .on('complete', () => {
        console.log('Fastest is ' + suite.filter('fastest').map('name'))
        console.log('---')
        process.nextTick(() => runSuites(followingSuites))
      })
      .run()
  }
}

const latencyMeter = require('./latency-meter')
const allSuites = require('./suites')

latencyMeter.start()
  .then(() => runSuites(allSuites))
  .then(() => latencyMeter.stop())

async function runSuites(suites) {
  return new Promise(resolve => {
    if (suites.length === 0) {
      return resolve()
    }

    const [suite, ...followingSuites] = suites
    suite
      .on('start', () => {
        console.log(suite.name)
        latencyMeter.beginMeasurement()
      })
      .on('cycle', event => {
        const latencyStats = latencyMeter.endMeasurement()
        console.log('  ', String(event.target))
        console.log('    ', String(latencyStats))
        latencyMeter.beginMeasurement()
      })
      .on('complete', async () => {
        latencyMeter.endMeasurement()
        console.log('Fastest is ' + suite.filter('fastest').map('name').join(' or '))
        console.log('---')

        await runSuites(followingSuites)
        resolve()
      })
      .run()
  })
}

const events = require('events')
const http = require('http')

const microtime = require('microtime')

const pongServer = http.createServer((req, res) => {
  res.end()
});

const rtts = []

let nextMeasureTimeout = null
let currentRequest = null

module.exports = {
  async start() {
    pongServer.listen(0, '127.0.0.1')
    await events.once(pongServer, 'listening')
  },

  beginMeasurement() {
    rtts.length = 0
    scheduleNextMeasurement(rtts)
  },

  endMeasurement() {
    if (nextMeasureTimeout) {
      clearTimeout(nextMeasureTimeout)
      nextMeasureTimeout = null
    }

    if (currentRequest) {
      currentRequest.on('error', () => {})
      currentRequest.abort()
      currentRequest = null
    }

    return analyzeRtts()
  },

  async stop() {
    pongServer.close()
    await events.once(pongServer, 'close')
  }
}

function scheduleNextMeasurement() {
  nextMeasureTimeout = setTimeout(measureRtt, 20)
}

function measureRtt() {
  const { address: host, port } = pongServer.address()

  nextMeasureTimeout = null

  const startTimeUs = microtime.now()
  currentRequest = http.get({ host, port }, res => {
    res.on('data', () => {})
    res.on('end', () => {
      const endTimeUs = microtime.now()
      rtts.push((endTimeUs - startTimeUs) / 1000)
      currentRequest = null
      scheduleNextMeasurement()
    })
  })
}

function analyzeRtts() {
  const min = rtts.reduce((smallest, rtt) => rtt < smallest ? rtt : smallest, Number.MAX_SAFE_INTEGER)
  const max = rtts.reduce((largest, rtt) => rtt > largest ? rtt : largest, 0)
  const sum = rtts.reduce((sum, rtt) => rtt + sum, 0)

  const n = rtts.length
  const mean = sum / n

  rtts.sort((a, b) => a - b)

  const pct50 = rtts[Math.floor(rtts.length * .5)]
  const pct90 = rtts[Math.floor(rtts.length * .9)]
  const pct99 = rtts[Math.floor(rtts.length * .99)]

  return {
    min,
    pct50,
    pct90,
    pct99,
    max,

    n,
    sum,
    mean,

    toString() {
      return `event latency n=${n} min=${min}ms p50=${pct50}ms p90=${pct90}ms p99=${pct99}ms max=${max}ms`
    }
  }
}

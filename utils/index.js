async function callNTimesWithSetImmediate(n, workFn) {
  await new Promise(resolve => {
    callNFurtherTimes(n)

    function callNFurtherTimes(nCallsRemaining) {
      if (nCallsRemaining >= 1) {
        workFn(nCallsRemaining)
        setImmediate(callNFurtherTimes, nCallsRemaining - 1)
      } else {
        resolve()
      }
    }
  })
}

function countWithin(val, match) {
  let count = 0

  if (match(val)) {
    count++
  }

  if (typeof val === 'object') {
    if (val instanceof Array) {
      for (const innerVal of val) {
        count += countWithin(innerVal, match)
      }
    } else if (!!val) {
      for (const innerVal of Object.values(val)) {
        count += countWithin(innerVal, match)
      }
    }
  }

  return count
}

module.exports = {
  callNTimesWithSetImmediate,
  countWithin
}

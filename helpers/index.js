'use strict'

function latencyTime (start) {
  if (start) {
    const delta = process.hrtime(start)
    return delta[0] * 1000 + delta[1] / 1e6
  } else {
    return process.hrtime()
  }
}

function getBuckets (options) {
  const defaultBuckets = [100, 200, 300, 500, 1000, 1500, 2000, 3000]
  return options && options.httpDurationBuckets && options.httpDurationBuckets.length ? options.httpDurationBuckets : defaultBuckets
}

function printBuckets (options) {
  return getBuckets(options).map(e => `${e}ms`).toString()
}

function getExclusion (exclusion, source) {
  if (!exclusion || !source) return false

  exclusion = exclusion instanceof Array ? exclusion : [exclusion]
  source = source instanceof Array ? source : [source]
  return exclusion.filter(e => source.includes(e)).length > 0
}

function pathTransform (options, ctx) {
  return (options && options.pathTransform && typeof options.pathTransform === 'function')
    ? options.pathTransform(options, ctx) : ctx.path
}

module.exports = { latencyTime, getBuckets, printBuckets, getExclusion, pathTransform }

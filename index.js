'use strict'
const cluster = require('cluster')
const client = require('prom-client')
const Koa = require('koa')
const AggregatorRegistry = client.AggregatorRegistry
const gcStats = require('prometheus-gc-stats')
const MetricSchema = require('./metrics')
const Helper = require('./helpers')

function metricExposeWrapper (options = {}) {
  return async function (ctx, next) {
    if (Helper.pathTransform(options, ctx) === options.metricPath && ctx.method.toLowerCase() === 'get') {
      ctx.set('Content-Type', client.register.contentType)
      ctx.body = client.register.metrics()
    } else {
      await next()
    }
  }
}

function clusterMettrics (options = {}) {
  if (options.isClusterMetric && cluster.isMaster) {
    const aggregatorRegistry = new AggregatorRegistry()
    const app = new Koa()
    app.use(async (ctx, next) => {
      if (Helper.pathTransform(options, ctx) === options.metricPath && ctx.method.toLowerCase() === 'get') {
        ctx.set('Content-Type', aggregatorRegistry.contentType)
        ctx.body = await aggregatorRegistry.clusterMetrics().then(r => r, e => console.log)
      } else {
        await next()
      }
    })
    return app.listen(options.clusterMetricPort || 9092)
  }
}

/*
 TODO: 1. push gateway for aggregator registry
 */

function exporterMiddleware (options = {}) {
  const metric = MetricSchema.load(client, options)

  if (metric.defaultMetricEnabled) {
    client.collectDefaultMetrics()
  }

  // prometheus gc stats depend on gc-stats installed success
  if (metric.gcStateMetricEnabled) {
    gcStats(client.register)
  }

  return async function httpMetricMiddleware (ctx, next) {
    if (Helper.getExclusion(metric.headerBlacklist, Object.keys(ctx.headers)) || Helper.getExclusion(metric.ignorePaht, [Helper.pathTransform(metric.options, ctx)])) {
      await metricExposeWrapper(metric.options)(ctx, next)
    } else {
      ctx.prometheus = client
      const start = Helper.latencyTime()
      try {
        await metricExposeWrapper(metric.options)(ctx, next)
      } catch (e) {
        if (metric.httpRequestErrorTotalEnabled && e.name) {
          const labels = { method: ctx.request.method, path: Helper.pathTransform(metric.options, ctx), status: ctx.response.status, error: e.name }
          metric.get('http_request_error_total').inc(labels)
        }
        throw e
      } finally {
        const labels = { method: ctx.request.method, path: Helper.pathTransform(metric.options, ctx), status: ctx.response.status }
        if (metric.httpRequestSizeBytesEnabled && ctx.request.length) {
          metric.get('http_request_size_bytes').observe(labels, ctx.request.length)
        }
        if (metric.httpResponseSizeBytesEnabled && ctx.response.length) {
          metric.get('http_response_size_bytes').observe(labels, ctx.response.length)
        }
        if (metric.httpRequestCountEnabled) {
          metric.get('http_request_total').inc(labels)
        }
        if (metric.httpDurationEnabled) {
          metric.get('http_request_duration').observe(labels, Helper.latencyTime(start))
        }
      }
    }
  }
}

module.exports = {
  prometheusExporterMiddleware: exporterMiddleware,
  clusterMettrics,
  promClient: client,
}

'use strict'

const assert = require('assert')
const request = require('supertest')
const Koa = require('koa')
const { prometheusExporterMiddleware, clusterMettrics, promClient } = require('../')

describe('prometheusExporterMiddleware', function() {
  beforeEach(function() {
    clearInterval(promClient.collectDefaultMetrics())
    promClient.register.clear()
  })

  test('use prometheus exporter middleware', function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({app: 'test', env: 'test', instance: 'localhost'}))
    assert(app.middleware.length > 0)
    assert.equal(app.middleware[0].name, 'httpMetricMiddleware')
    assert.equal(app.middleware[0][Symbol.toStringTag], 'AsyncFunction')
  })

  test('fetch metrics', async function() {
    const http_request_total = 'http_request_total{method="GET",path="/path1",status="404",app="test",env="test",instance="localhost"} 1'
    const app = new Koa()
    app.use(prometheusExporterMiddleware({app: 'test', env: 'test', instance: 'localhost'}))
    const server = app.listen()
    await request(server).get('/path1')
    const res = await request(server).get('/metrics')
    
    assert(res.text)
    assert(res.text.includes(http_request_total))
    server.close()
  })

  test('fetch default metrics', async function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost', 
      defaultMetricEnabled: true
    }))
    const server = app.listen()
    const res = await request(server).get('/metrics')
    assert(res.text.includes('process_cpu_user_seconds_total'))
    assert(res.text.includes('nodejs_eventloop_lag_seconds'))
    server.close()
  })

  test('fetch gcStats metrics', async function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost', 
      gcStateMetricEnabled: true
    }))
    const server = app.listen()
    const res = await request(server).get('/metrics')
    assert(res.text.includes('nodejs_gc_runs_total'))
    assert(res.text.includes('nodejs_gc_pause_seconds_total'))
    assert(res.text.includes('nodejs_gc_reclaimed_bytes_total'))
    server.close()
  })

  test('headerBlacklist', async function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost',
      headerBlacklist: 'not_allowed'
    }))
    const server = app.listen()
    await request(server).get('/path1').set('not_allowed', 'true')

    const res = await request(server).get('/metrics')
    assert(!res.text.includes('/path1'))
    server.close()
  })

  test('ignorePaht', async function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost',
      ignorePaht: '/path1'
    }))
    const server = app.listen()
    await request(server).get('/path1')

    const res = await request(server).get('/metrics')
    assert(!res.text.includes('/path1'))
    server.close()
  })

  test('httpRequestSizeBytesEnabled', async function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost',
      httpRequestSizeBytesEnabled: true
    }))
    const server = app.listen()
    await request(server).get('/path1').set('Content-Length', '10')

    const res = await request(server).get('/metrics')
    assert(res.text.includes('http_request_size_bytes'))
    server.close()
  })

  test('httpResponseSizeBytesEnabled', async function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost',
      httpResponseSizeBytesEnabled: true
    }))
    const server = app.listen()
    await request(server).get('/path1')

    const res = await request(server).get('/metrics')
    assert(res.text.includes('http_response_size_bytes'))
    server.close()
  })

  test('httpRequestErrorTotalEnabled', async function() {
    const app = new Koa()
    app.onerror = (err) => {
      assert(err instanceof Error, `non-error thrown: ${err}`);
      if (404 == err.status || err.expose) return;
      if (this.silent) return;
    }

    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost',
      httpRequestErrorTotalEnabled: true
    }))

    app.use(async (ctx, next) => {
      if (ctx.path === '/path1') {
        throw new Error
      }
      await next()
    })

    const server = app.listen()
    await request(server).get('/path1')
    const res = await request(server).get('/metrics')
    assert(res.text.includes('http_request_error_total'))
    server.close()
  })
})

describe('clusterMettrics', function() {
  beforeEach(function() {
    clearInterval(promClient.collectDefaultMetrics())
    promClient.register.clear()
  })

  test('setup cluster mettrics', async function() {
    const clusterServer = clusterMettrics({isClusterMetric: true, metricPath: '/metrics'})
    const res = await request(clusterServer).get('/metrics')
    const normalRes = await request(clusterServer).get('/path')
    assert.equal(res.status, 200)
    assert.equal(normalRes.status, 404)
    clusterServer.close()
  })

  test('push to getway', async function() {
    //TODO: not implement
  })
})

describe('promClient', function() {
  beforeEach(function() {
    clearInterval(promClient.collectDefaultMetrics())
    promClient.register.clear()
  })

  test('promClient should contain the same metircs with middleware client', function() {
    const app = new Koa()
    app.use(prometheusExporterMiddleware({
      app: 'test', 
      env: 'test', 
      instance: 'localhost',
    }))

    assert(promClient.register.getSingleMetric('http_request_total'))
    assert(promClient.register.getSingleMetric('http_request_duration'))
  })
})

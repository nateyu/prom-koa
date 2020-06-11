'use strict'
const assert = require('assert')
const client = require('prom-client')
const Metric = require('../../metrics')
const Schema = require('../../metrics/schema')

describe('metrics', function () {
  beforeEach(function () {
    client.register.clear()
  })

  test('init a metric object', function () {
    const metric = new Metric(client, { app: 'koa-prom', env: 'dev', instance: 'localhost' })
    assert.equal(metric.constructor, Metric)
  })

  test('will get exceptions with missing config', function () {
    assert.throws(() => new Metric({ app: 'koa-prom', env: 'dev', instance: 'localhost' }), assert.AssertionError)
    assert.throws(() => new Metric(client, { env: 'dev', instance: 'localhost' }), assert.AssertionError)
    assert.throws(() => new Metric(client, { app: 'koa-prom', instance: 'localhost' }), assert.AssertionError)
    assert.throws(() => new Metric(client, { app: 'koa-prom', env: 'dev' }), assert.AssertionError)
  })

  test('validate()', function () {
    const metric = new Metric(client, { app: 'koa-prom', env: 'dev', instance: 'localhost' })
    const defaultSchemas = Schema.getSchema()

    defaultSchemas.forEach((item) => {
      assert(metric.validate(item))
    })
  })

  test('build()', function () {
    const metric = new Metric(client, { app: 'koa-prom', env: 'dev', instance: 'localhost' })
    const counter = metric.build({
      type: 'Counter',
      name: `http_request_total`,
      help: '统计每个服务的https请求总数，包含method、path、status等默认标签。',
      labelNames: ['method', 'path', 'status']
    })

    assert.equal(counter.constructor, client.Counter)
  })

  test('load()', function () {
    const metric = new Metric(client, { app: 'koa-prom', env: 'dev', instance: 'localhost' })
    assert.equal(metric.load().length, 5)
  })

  test('get()', function () {
    const metric = new Metric(client, { app: 'koa-prom', env: 'dev', instance: 'localhost' })
    metric.load()
    assert.equal(metric.get('http_request_duration').constructor, client.Histogram)
  })

  test('Metric.load()', function () {
    const metric = Metric.load(client, { app: 'koa-prom', env: 'dev', instance: 'localhost' })
    assert.equal(metric.constructor, Metric)
  })
})

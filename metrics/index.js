'use strict'
const assert = require('assert')
const definition = require('./schema')

const configure = options => {
  const defaultOptions = {
    metricPath: '/metrics',
    httpDurationEnabled: true,
    httpRequestCountEnabled: true,
    httpRequestSizeBytesEnabled: false,
    httpResponseSizeBytesEnabled: false,
    httpRequestErrorTotalEnabled: false,
    defaultMetricEnabled: false,
    gcStateMetricEnabled: false,
    httpDurationBuckets: [],
    ignorePaht: [],
    headerBlacklist: [],
    additionalLabels: [],
    additionalMetrics: []
  }
  options = Object.assign(defaultOptions, options)

  assert(options.app, 'app label is required option')
  assert(options.env, 'env label is required option')
  assert(options.instance, 'instance label is required option')
  return options
}

class Metric {
  constructor (client, options = {}) {
    assert(client && client.register, 'Prometheus client is required')
    this.client = client
    this.options = options = configure(options)
    Object.assign(this, options)
    client.register.setDefaultLabels({ app: options.app, env: options.env, instance: options.instance })
  }

  validate (schema) {
    const verifications = {
      type: 'Schema type is required',
      name: 'Schema name is required',
      help: 'Schema help is required',
      labelNames: 'Schema labelNames is required'
    }
    for (let key in verifications) {
      assert(schema[key], verifications[key])
    }
    return schema
  }

  build (schema) {
    schema = this.validate(schema)
    return new (this.client[schema.type])(schema)
  }

  load () {
    return definition.getSchema(this.options).map(e => this.build(e))
  }

  get (name) {
    return this.client.register.getSingleMetric(name)
  }

  static load () {
    const metric = new Metric(...arguments)
    metric.load()
    return metric
  }
}

module.exports = Metric

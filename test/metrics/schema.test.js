'use strict'
const assert = require('assert')
const schema = require('../../metrics/schema')

describe('schema', function() {
  test('getLabelNames will return default label names', function() {
    assert.deepStrictEqual(schema.getLabelNames(), ['method', 'path', 'status'])
  })

  test('getLabelNames with additionalLabels', function() {
    assert.deepStrictEqual(schema.getLabelNames({
      additionalLabels: ['customLabel1', 'customLabel2']
    }), ["method", "path", "status", "customLabel1", "customLabel2"])
  }) 

  test('getSchema will return default metric definition', function() {
    const metricDefinition = schema.getSchema()
    assert(metricDefinition.length > 0)
    assert(metricDefinition instanceof Array)
  })

  test('getSchema will return metric with custom httpDurationBuckets', function() {
    const metricDefinition = schema.getSchema({
      httpDurationBuckets: [100, 200]
    })
    const httpRequestDefinition =  [{ type: 'Histogram',
      name: 'http_request_duration',
      help: '统计每个服务请求的消耗时间分布，包含method、path、status等默认标签。统计区间有100ms,200ms',
      labelNames: [ 'method', 'path', 'status' ],
      buckets: [ 100, 200 ]
    }]
    const httpRequestDuration = metricDefinition.filter(item => item.name === 'http_request_duration')
    assert.deepStrictEqual(httpRequestDuration, httpRequestDefinition)
  })

  test('getSchema with additionalLabels', function() {
    const metricDefinition = schema.getSchema({
      additionalLabels: ['customLabel1', 'customLabel2']
    })
    metricDefinition.forEach((item) => {
      assert(item.labelNames.includes('customLabel1'), `${item.name} doesn't contain label customLabel1`)
      assert(item.labelNames.includes('customLabel2'), `${item.name} doesn't contain label customLabel2`)
    })
  })

  test('getSchema with additionalMetrics', function() {
    const metricDefinition = schema.getSchema({
      additionalMetrics: [{ 
        type: 'Histogram',
        name: 'additional_metric',
        help: 'additional metric description',
        labelNames: ['label1', 'label2', 'label3'],
        buckets: [ 100, 200 ]
      }]
    })
    const additional_metric = metricDefinition.filter(item => item.name === 'additional_metric')
    assert.deepEqual(additional_metric[0].labelNames, ['method', 'path', 'status', 'label1', 'label2', 'label3'])
  })

  test('getSchema with additionalMetrics and additionalLabels', function() {
    const metricDefinition = schema.getSchema({
      additionalLabels: ['customLabel1', 'customLabel2'],
      additionalMetrics: [{ 
        type: 'Histogram',
        name: 'additional_metric',
        help: 'additional metric description',
        labelNames: ['label1', 'label2', 'label3'],
        buckets: [ 100, 200 ]
      }]
    })
    const additional_metric = metricDefinition.filter(item => item.name === 'additional_metric')
    assert.deepEqual(additional_metric[0].labelNames, ['method', 'path', 'status', 'customLabel1', 'customLabel2', 'label1', 'label2', 'label3'])
  })
})
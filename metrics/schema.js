'use strict'
const Helper = require('../helpers')

const getLabelNames = (options) => {
  const defaultLabels = new Set(['method', 'path', 'status'])
  
  if (options && options.additionalLabels && options.additionalLabels instanceof Array) {
    options.additionalLabels.forEach(item => defaultLabels.add(item))
  }

  return [...defaultLabels]
}

const getSchema = (options) => {
  const defaultSchema = [{
    type: 'Counter',
    name: `http_request_total`,
    help: '统计每个服务的https请求总数，包含method、path、status等默认标签。',
    labelNames: getLabelNames(options)
  },
  {
    type: 'Histogram',
    name: 'http_request_duration',
    help: `统计每个服务请求的消耗时间分布，包含method、path、status等默认标签。统计区间有${Helper.printBuckets(options)}`,
    labelNames: getLabelNames(options),
    buckets: Helper.getBuckets(options)
  },
  {
    type: 'Summary',
    name: 'http_request_size_bytes',
    help: '统计每个服务请求的数据包大小，包含method、path、status等默认标签。',
    labelNames: getLabelNames(options)
  },
  {
    type: 'Summary',
    name: 'http_response_size_bytes',
    help: '统计每个请求的响应数据包大小，包含method、path、status等默认标签。',
    labelNames: getLabelNames(options)
  },
  {
    type: 'Counter',
    name: 'http_request_error_total',
    help: '统计服务请求的错误错误总数，包含method、path、status等默认标签。',
    labelNames: getLabelNames(options).concat('error')
  }]

  if (options && options.additionalMetrics && options.additionalMetrics instanceof Array) {
    options.additionalMetrics.forEach((item) => {
      const mergedLabels = new Set(getLabelNames(options).concat(item.labelNames))
      item.labelNames = [...mergedLabels]
      defaultSchema.push(item)
    })
  }

  return defaultSchema
}
module.exports = { getLabelNames, getSchema }

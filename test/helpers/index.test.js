'use strict'
const assert = require('assert')
const lolex = require('lolex')
const Helper = require('../../helpers')

describe('helpers', function() {
  test('latencyTime', function() {
    const clock = lolex.install()
    assert.deepStrictEqual(Helper.latencyTime(), clock.hrtime())
    clock.uninstall()
  })

  test('latencyTime 1000ms', function() {
    const clock = lolex.install({shouldAdvanceTime: true, advanceTimeDelta: 1000})
    const start = clock.hrtime()
    setTimeout(() => {
      assert.equal(Helper.latencyTime(start), 1000)
    }, 1000)
    clock.tick(1000);
    clock.uninstall()
  })

  test('getBuckets() will get defaultBuckets', function() {
    const defaultBuckets = [100, 200, 300, 500, 1000, 1500, 2000, 3000]
    assert.deepStrictEqual(Helper.getBuckets(), defaultBuckets)
  })

  test('getBuckets() will get httpDurationBuckets', function() {
    const customBuckests = [500, 300, 600]
    const options = { httpDurationBuckets: customBuckests }
    assert.deepStrictEqual(Helper.getBuckets(options), customBuckests)
  })

  test('printBuckets() will buckets in ms', function() {
    assert.equal(Helper.printBuckets(), "100ms,200ms,300ms,500ms,1000ms,1500ms,2000ms,3000ms")
  })

  test('getExclusion()', function() {
    assert(Helper.getExclusion(['/foo/bar'], ['/foo/bar', '/assets/js']))
    assert(!Helper.getExclusion(null, ['/foo/bar', '/assets/js']))
    assert(!Helper.getExclusion(null, null))
    assert(Helper.getExclusion('/foo/bar', ['/foo/bar', '/assets/js']))
    assert(Helper.getExclusion('/foo/bar', '/foo/bar'))
  })

  test('pathTransform() will get original path', function() {
    const options = {}, ctx = new Object()
    ctx.path = '/metrics'
    assert.equal(Helper.pathTransform(options, ctx), ctx.path)
  })

  test('pathTransform() will get a transformative path when pathTransform fn supplyed', function() {
    const ctx = new Object()
    const options = { pathTransform: (opt, ctx) => { return `${ctx.path}/transformation`} }
    ctx.path = '/metrics'
    assert.equal(Helper.pathTransform(options, ctx), '/metrics/transformation')
  })
});


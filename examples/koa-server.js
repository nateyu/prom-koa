const Koa = require('koa')
const promkoa = require('../')

const app = new Koa()

app.use(promkoa.prometheusExporterMiddleware({
  app: 'my-app',
  env: 'dev',
  instance: 'localhost'
}))

app.use(async (ctx, next) => {})

app.listen(8080)

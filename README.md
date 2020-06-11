Prom koa
===========================
koa prometheus exporter 默认收集请求总数，响应耗时，请求数bytes和响应数据bytes。默认标签有`method, path, status`, 支持自定义metrics扩展。


### 使用方法

  ```
    const Koa = require('koa')
    const promkoa = require('prom-koa')
    const app = new Koa();
    // 使用默认参数加载koa监控， app和env是必须参数，为了保证数据准确promkoa请放在中间件的最上层
    app.use(promkoa.prometheusExporterMiddleware({
        app: 'my-app',
        env: 'dev',
        instance: 'localhost'
    }))

    // 业务逻辑中间件加载
    app.use(async (ctx, next) => {}) 

    app.listen(8080)
  ```

### 默认参数

| 参数名                        | 类型    | 默认值                   | 说明                                       |
|:---------------------------- |:--------|:------------------------|:-------------------------------------------|
| env                          | String  | ''                      | 必填，标注服务环境                           |
| metricPath                   | String  | '/metrics'              | 可选，用于pull 模式                          |
| httpDurationEnabled          | Boolean | true                    | 可选，是否记录请求时间                        |
| httpRequestCountEnabled      | Boolean | true                    | 可选，是否记录请求次数                        |
| httpRequestSizeBytesEnabled  | Boolean | false                   | 可选，是否记录请求数据大小                    |
| httpResponseSizeBytesEnabled | Boolean | false                   | 可选，是否记录响应数据大小                    |
| httpRequestErrorTotalEnabled | Boolean | false                   | 可选，是否异常类型次数                        |
| defaultMetricEnabled         | Boolean | false                   | 可选，Nodejs 默认的metrics                  |
| gcStateMetricEnabled         | Boolean | false                   | 可选，内存回收相关的metrics                  |
| httpDurationBuckets          | Array   | []                      | 可选，设置httpDurationBuckets               |
| ignorePaht                   | Array   | []                      | 可选，ignorePaht里面的请求将不被跟踪          |
| headerBlacklist              | Array   | []                      | 可选，headerBlacklist 里的header将不被记录   |
| jobName                      | String  | ''                      | 必填，push模式的jobname                      |
| pathTransform                | Function| null                    | 可选，对path标签的转换，默认为ctx.path         |
| isClusterMetric              | Boolean | false                   | 可选，是否打开集群模式                        |
| clusterMetricPort            | Integer | 9092                    | 可选，聚合模式pull mertirc端口                |
| additionalMetrics            | Array   | []                      | 可选，默认metric以外的自定义指标               |
| additionalLabels             | Array   | []                      | 可选，默认label以外的自定义标签名              |



### 集群支持
  
  一般web service都是集群加cluster模式部署，导致prometheus一个scrape时只能拉取部分数据，因此我们采取聚合方式方式收集数据，在master进程上面通过ipc收集子进程的数据，并且开启一个独立的服务处理pull请求，默认端口为`9092`.

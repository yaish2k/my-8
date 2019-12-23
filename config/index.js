const devConfig = require('./env/dev');
const prodConfig = require('./env/prod');
const testConfig = require('./env/test')

module.exports = {
    development: devConfig,
    production: prodConfig,
    test: testConfig
}[process.env.NODE_ENV || 'development'];
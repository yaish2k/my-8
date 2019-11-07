const devConfig = require('./env/dev');
const prodConfig = require('./env/prod');

module.exports = {
    development: devConfig,
    production: prodConfig
}[process.env.NODE_ENV || 'development'];
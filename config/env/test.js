const settings = require('./prod');
module.exports = {
    ...settings,
    db: process.env.MONGODB_TEST_URL,
}
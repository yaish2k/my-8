const port = parseInt(process.env.PORT) || 3000;
const {app} = require('./app');
const mongoose = require('mongoose');
const config = require('./config/index');
const join = require('path').join;
const models = join(__dirname, 'models');

function listen() {
    app.listen(port);
    console.log('Express my-8 app started on port ' + port);
}

function connect() {
    mongoose.connection
        .on('error', console.log)
        .on('disconnected', connect)
        .once('open', listen);
    mongoose.connect(config.db, { keepAlive: 1 })
}
// bootstrap app
connect();

const port = parseInt(process.env.PORT) || 3000;
const { app } = require('./app');
const mongoose = require('mongoose');
const config = require('./config/index');
const {BaseError} = require('./utils/errors');


app.use(function errorHandling(err, req, res, next) {
    if (err instanceof BaseError) {
        let messageObject = JSON.parse(err.message);
        res.status(418).json({
            message: messageObject.message,
            code: messageObject.code,
            errorName: err.errorName
        });
    } else {
        res.status(418).json({ message: err.message });
    }
});

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

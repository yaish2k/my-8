const port = parseInt(process.env.PORT) || 3000;
const { app } = require('./app');
const mongoose = require('mongoose');
const config = require('./config/index');
const { BaseError, NexmoError } = require('./utils/errors');


app.use(function errorHandlingMiddleware(err, req, res, next) {
    const { isError, messageObject } = handleError(err);
    const status = isError ? 418 : 200
    res.status(status).json(messageObject);
});

function handleError(err) {
    if (err instanceof NexmoError) {
        return { isError: false, messageObject: { message: 'OK' } };
    }
    if (err instanceof BaseError) {
        let messageData = JSON.parse(err.message);
        return {
            isError: true, messageObject: {
                message: messageData.message, code: messageData.code, errorName: err.errorName
            }
        };
    }
    return { isError: true, messageObject: { message: err.message } };
}

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

module.exports = {
    app
}

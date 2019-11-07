const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const config = require('./config/index');
const join = require('path').join;
const fs = require('fs');
const models = join(__dirname, 'models');
const app = express();
const port = parseInt(process.env.PORT) || 3000;
app.use(bodyParser.urlencoded({ extended: false }));

// bootstrap mongodb schemas
createSchemas();

// bootstrap routes
const userRoutes = require('./routes/user');
const contactRequestRoutes = require('./routes/contact-requests')
app.use('/user', userRoutes);
app.use('/contact-requests', contactRequestRoutes)

function listen() {
    app.listen(port);
    console.log('Express my-8 app started on port ' + port);
}

function createSchemas() {
    config.schemaDepsOrder.forEach(file => {
        require(join(models, file))
    })
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
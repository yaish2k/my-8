const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const config = require('./config/index');
var cors = require('cors');
const join = require('path').join;
const models = join(__dirname, 'models');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

function createSchemas() {
    config.schemaDepsOrder.forEach(file => {
        require(join(models, file))
    });
}
// bootstrap mongodb schemas
createSchemas();

// bootstrap routes
const usersRoutes = require('./routes/user');
const contactRequestRoutes = require('./routes/contact-request');
const smsRoutes = require('./routes/sms');
const callRoutes = require('./routes/call');

app.use('/users', usersRoutes);
app.use('/contact-requests', contactRequestRoutes);
app.use('/messages', smsRoutes);
app.use('/calls', callRoutes);

module.exports = {
    app
};
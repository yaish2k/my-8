const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require('body-parser');
const config = require('./config/index');
const join = require('path').join;
const models = join(__dirname, 'models');
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function createSchemas() {
    config.schemaDepsOrder.forEach(file => {
        require(join(models, file))
    });
}
// bootstrap mongodb schemas
createSchemas();

// bootstrap routes
const userRoutes = require('./routes/user');
const contactRequestRoutes = require('./routes/contact-requests');

app.use('/user', userRoutes);
app.use('/contact-requests', contactRequestRoutes);

module.exports = {
    app
};
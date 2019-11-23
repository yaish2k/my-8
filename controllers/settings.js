const { getAppSettings } = require('../utils/utilities');

exports.getAppSettings = (req, res, next) => {
    const appSettings = getAppSettings();
    res.status(200).send(appSettings);
}
const admin = require('firebase-admin');
const config = require('../config/index');

admin.initializeApp({
    credential: admin.credential.cert(config.firebase.credentials),
    databaseURL: config.firebase.databaseURL
});


class FirebaseAdmin {
    static verifyIdToken(token) {
        return admin.auth().verifyIdToken(token);
    }

    static getUser(userId) {
        return admin.auth().getUser(userId);
    }

    static async sendPushNotification(notificationMessage, pushNotificationsToken) {
        let message = {
            notification: notificationMessage,
            token: pushNotificationsToken
        }
        try {
            const response = await admin.messaging().send(message);
            return `Successfully sent message: ${response}`
        } catch (err) {
            throw Error(`Error sending message ${err}`);
        }
    }
}

module.exports = {
    FirebaseAdmin
}
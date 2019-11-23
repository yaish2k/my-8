const admin = require('firebase-admin');
const fireBaseSettings = require('../config/index').firebase;

admin.initializeApp({
    credential: admin.credential.cert(fireBaseSettings.credentials),
    databaseURL: fireBaseSettings.databaseURL
});


class FirebaseAdmin {
    static verifyIdToken(token) {
        return admin.auth().verifyIdToken(token);
    }

    static getUser(userId) {
        return admin.auth().getUser(userId);
    }

    static async sendPushNotification(notificationMessage, pushNotificationData,
        pushNotificationsToken) {
        pushNotificationData = Object.keys(pushNotificationData).reduce((acc, currKey) => {
            acc[currKey] = pushNotificationData[currKey].toString();
            return acc;
        }, {});

        let message = {
            notification: notificationMessage,
            token: pushNotificationsToken,
            data: pushNotificationData

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
const mongoose = require('mongoose');
const User = mongoose.model('User');
const { PHONE_VALIDATOR } = require('../utils/validators');
const { FirebaseAdmin } = require('../utils/firebase');
const { formatString } = require('../utils/utilities')
const Schema = mongoose.Schema;
const appSettings = require('../config/index').app;
const { STATUS_CODES } = require('../utils/status_codes');
const { DatabaseError, ItegrityError, MaxiumEightUsersError } = require('../utils/errors');

/**
 * ContactRequest Schema
 */

const status = {
    PENDING: 'pending',
    DECLINED: 'declined'
}

const ContactRequestSechma = new Schema({
    createdAt: { type: Date, default: Date.now },
    asking_user: { type: Schema.Types.ObjectId, ref: 'User' },
    target_phone_number: {
        type: String,
        validate: PHONE_VALIDATOR,
        required: [true, 'User phone number required']
    },
    target_contact_name: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: status.PENDING,
    }
});

/**
 * Methods
 */

ContactRequestSechma.methods = {
    /**
     * all the contacts that the user requested (can be only from ContactRequest type) 
     * @param {*} newStatus 
     * @returns Promise<ContactRequest>
     */
    changeStatus(newStatus) {
        this.status = newStatus;
        return this.save();
    }
}
/**
 * Statics
 */

ContactRequestSechma.statics = {


    getUserWaitingList(askingUserId) {
        const ContactRequestModel = this;
        return ContactRequestModel
            .find({ asking_user: askingUserId })
            .select('target_phone_number target_contact_name status')
            .lean(true)
            .exec()
    },

    async getUserPendingList(requestedUserPhoneNumber) {
        const ContactRequestModel = this;
        const contactRequestsArray =
            await ContactRequestModel
                .find({
                    target_phone_number: requestedUserPhoneNumber,
                    status: status.PENDING
                })
                .populate({
                    path: 'asking_user',
                    select: 'name phone_number image_url'
                })
                .lean(true)
                .exec()
        return contactRequestsArray
            .map(contactRequest => contactRequest.asking_user);
    },

    getContactRequest(askingUser, targetPhoneNumber, status) {
        const ContactRequestModel = this;
        return ContactRequestModel
            .findOne({
                asking_user: askingUser._id,
                target_phone_number: targetPhoneNumber,
                status: status
            }).exec();
    },


    async declineContactRequest(decliningUser,
        askingPhoneNumber) {
        let askingUser;
        // fetch the asking user by the askingPhoneNumber

        askingUser = await User.getUserByPhoneNumber(askingPhoneNumber);
        if (!askingUser) {
            throw new DatabaseError('User not found');
        }
        // get contact request for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            decliningUser.phone_number, status.PENDING)
        if (!contactRequest) {
            throw new DatabaseError("Contact request doesn't exist");
        }
        try {
            return contactRequest.changeStatus(status.DECLINED);
        } catch (err) {
            throw new DatabaseError("Failed to update contact request status");
        }

    },

    async approveContactRequest(approvingUser,
        askingPhoneNumber) {
        const ContactRequestModel = this;
        let askingUser;
        // fetch the asking user by the askingPhoneNumber

        askingUser = await User.getUserByPhoneNumber(askingPhoneNumber);
        if (!askingUser) {
            throw new DatabaseError('User not found');
        }
        // get contact request for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            approvingUser.phone_number, status.PENDING);
        if (!contactRequest) {
            throw new DatabaseError("Contact request doesn't exist");
        }
        const askingUserAsContact = User.getContactOfUserById(approvingUser, askingUser._id);
        if (askingUserAsContact && askingUserAsContact.status === 'approved') {
            throw new ItegrityError('Asking user is already part of the approving user contacts');
        }

        const approvingUserAliasName = contactRequest.target_contact_name;
        this.removeContactRequest(contactRequest);
        await this.createMatchBetweenUsers(askingUser, approvingUser, approvingUserAliasName);
        return this.sendPushNotificationToAskingUser(askingUser, approvingUser);

    },

    sendPushNotificationToAskingUser(askingUser, approvingUser) {

        const pushNotificationsToken = askingUser.push_notifications_token;
        if (pushNotificationsToken) {
            const pushNotificationMessage = {
                title: 'Pending request approved',
                body: formatString(STATUS_CODES.STATUS_2020.message, approvingUser.name)
            }
            const pushNotificationData = {
                status_code: STATUS_CODES.STATUS_2020.code
            }
            return FirebaseAdmin.sendPushNotification(pushNotificationMessage,
                pushNotificationData,
                pushNotificationsToken);
        }
    },

    createMatchBetweenUsers(
        askingUser,
        approvingUser,
        approvingUserAliasName) {
        try {
            return User.createMatchBetweenUsers(askingUser, approvingUser, approvingUserAliasName);
        } catch (err) {
            throw new DatabaseError('Failed to create match between contacts');
        }

    },
    removeContactRequest(contactRequest) {
        try {
            contactRequest.remove();
        } catch (err) {
            throw new DatabaseError('Failed to delete contact request');
        }
    },

    createContactRequest: async function (askingUser,
        targetPhoneNumber,
        targetContactName) {
        // check if  contact request exists for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            targetPhoneNumber, status.PENDING)
        if (contactRequest) {
            throw new ItegrityError('Contact request already exists');
        }

        // check if user allow to add another contact
        if (!askingUser.isAllowToAddAnotherContact()) {
            throw new MaxiumEightUsersError(`user is not allowed to add more than ${appSettings.MAX_APPROVED_CONTACTS}`);
        }

        // check if the target user is already part of my contacts
        let isAlreadyPartOfMyContacts = false;
        targetUser = await User.getUserByPhoneNumber(targetPhoneNumber)
        if (targetUser) {
            const targetContact = User.getContactOfUserById(askingUser, targetUser._id);
            if (targetContact && targetContact.status === 'approved') {
                isAlreadyPartOfMyContacts = true;
            }
        }
        if (isAlreadyPartOfMyContacts) {
            throw new ItegrityError('Target user is already part of the requesting user approved contacts');
        }
        // create and save new ContactRequest
        try {
            return this.createContactRequestInstance(
                askingUser._id,
                targetContactName,
                targetPhoneNumber
            );
        } catch (err) {
            throw new DatabaseError('Failed to create contact request');
        }

    },
    createContactRequestInstance(
        askingUserId,
        targetContactName,
        targetPhoneNumber) {
        const ContactRequestModel = this;
        const newContactRequest = new ContactRequestModel({
            asking_user: askingUserId,
            target_contact_name: targetContactName,
            target_phone_number: targetPhoneNumber,
        });
        return newContactRequest.save();
    },
    removeRequestFromWaitingList(askingUser, targetPhoneNumber) {
        const ContactRequestModel = this;
        return ContactRequestModel
            .deleteOne({
                asking_user: askingUser._id,
                target_phone_number: targetPhoneNumber
            })
            .exec()
    }
}

mongoose.model('ContactRequest', ContactRequestSechma);

const mongoose = require('mongoose');
const User = mongoose.model('User');
const { PHONE_VALIDATOR } = require('../utils/validators');
const Schema = mongoose.Schema;

/**
 * ContactRequest Schema
 */

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
    }
});

/**
 * Statics
 */

ContactRequestSechma.statics = {

    isContactRequestExists: function (askingUser, targetPhoneNumber) {
        const ContactRequestModel = this;
        return ContactRequestModel.exists({
            asking_user: askingUser._id,
            target_phone_number: targetPhoneNumber
        });
    },

    getContactRequest: function (askingUser, targetPhoneNumber) {
        const ContactRequestModel = this;
        return ContactRequestModel
            .findOne({
                asking_user: askingUser._id,
                target_phone_number: targetPhoneNumber
            }).exec();
    },


    declineContactRequest: async function (decliningUser,
        targetPhoneNumberToDecline) {
        const ContactRequestModel = this;
        let askingUser;
        // fetch the asking user by the targetPhoneNumberToDecline

        askingUser = await User.getUserByPhoneNumber(targetPhoneNumberToDecline);
        if (!askingUser) {
            throw Error('User not found');
        }
        // get contact request for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            decliningUser.phone_number)
        if (!contactRequest) {
            throw new Error("Contact request doesn't exist");
        }

        // remove contact request from user array
        try {
            await askingUser.removePendingContactRequest(contactRequest)
        } catch (err) {
            throw Error('Failed to delete contact request from user list');
        }
        try {
            return contactRequest.remove();
        } catch (err) {
            throw Error('Failed to delete contact request');
        }

    },

    approveContactRequest: async function (approvingUser,
        targetPhoneNumberToApprove) {
        const ContactRequestModel = this;
        let askingUser;
        // fetch the asking user by the targetPhoneNumberToApprove

        askingUser = await User.getUserByPhoneNumber(targetPhoneNumberToApprove);
        if (!askingUser) {
            throw Error('User not found');
        }
        // get contact request for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            approvingUser.phone_number)
        if (!contactRequest) {
            throw new Error("Contact request doesn't exist");
        }

        const contactAliasName = contactRequest.target_contact_name;
        // remove contact request from user array
        try {
            await askingUser.removePendingContactRequest(contactRequest)
        } catch (err) {
            throw Error('Failed to delete contact request from user list');
        }
        try {
            contactRequest.remove();
        } catch (err) {
            throw Error('Failed to delete contact request');
        }

        try {
            return askingUser.addContact(approvingUser, contactAliasName);
        } catch (err) {
            throw Error('Failed to add contact to user contact list');
        }
    },
    createContactRequest: async function (askingUser,
        targetPhoneNumber,
        targetContactName) {
        const ContactRequestModel = this;

        const contactRequest = await this.getContactRequest(askingUser,
            targetPhoneNumber)
        if (contactRequest) {
            throw new Error('Contact request already exists');
        }
        let newContactRequest = new ContactRequestModel({
            asking_user: askingUser._id,
            target_contact_name: targetContactName,
            target_phone_number: targetPhoneNumber,
        });
        let newContact;
        try {
            newContact = await newContactRequest.save();
        } catch (err) {
            throw new Error('Failed to create contact');
        }

        try {
            return askingUser.addPendingContactRequest(newContact);
        } catch (err) {
            throw new Error('Failed to add contact for asking user');
        }

    }
}

mongoose.model('ContactRequest', ContactRequestSechma);

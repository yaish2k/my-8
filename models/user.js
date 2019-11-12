const mongoose = require('mongoose');
const { PHONE_VALIDATOR, IMAGE_VALIDATOR, EMAIL_VALIDATOR } = require('../utils/validators');
const Schema = mongoose.Schema;
const { castToObjectId, castToId } = require('../utils/utilities');
const _ = require('lodash');
/**
 * User Schema
 */

const status = {
    NOT_VALID: 'not_valid',
    APPROVED: 'approved',
}

const UserSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    name: { type: String, default: '' },
    push_notifications_token: { type: String, default: '' },
    os: { type: String, default: '' },
    phone_number: {
        unique: true,
        immutable: true,
        type: String,
        validate: PHONE_VALIDATOR,
        required: [true, 'User phone number required']
    },
    image_url: {
        type: String,
        default: '',
        validate: IMAGE_VALIDATOR
    },
    approved_contacts: [
        {
            created_at: { type: Date, default: Date.now },
            user: { type: Schema.Types.ObjectId, ref: 'User' },
            contact_alias_name: { type: String, default: '' },
            status: { type: String, default: status.APPROVED }
        }
    ]

});
UserSchema.virtual('id').get(function () {
    return this._id.toHexString();
});

// Ensure virtual fields are serialised.
UserSchema.set('toJSON', {
    virtuals: true
});


/**
 * Methods
 */

UserSchema.methods = {
    addContact(contactUser, contactAliasName) {
        const UserModel = this.constructor;
        existingContact = UserModel.getContactOfUserById(this, contactUser._id);
        if (existingContact && existingContact.status === status.NOT_VALID) {
            return UserModel.updateUserContactStatus(this._id, contactUser._id, status.APPROVED);
        } else {
            return UserModel.addContactToArray(this, contactUser._id, contactAliasName);
        }
    },

    async removeContact(contactId) {
        const UserModel = this.constructor;
        await UserModel.removeContactFromArray(this, contactId);
        // in the contact list i need to update myself to not valid
        return UserModel.updateUserContactStatus(contactId, this._id, status.NOT_VALID);
    },
}
/**
 * Statics
 */

UserSchema.statics = {

    createUser(body) {
        const UserModel = this;
        let newUser = new UserModel(body);
        return newUser.save();
    },

    editUser(userId, updatedFields) {
        const UserModel = this;
        return UserModel.updateOne({ _id: userId }, updatedFields);
    },

    getContactOfUserById(user, contactId) {
        approvedContact = _.find(user.approved_contacts, (c) => {
            c.user.toString() !== castToId(contactId);
        })
        return approvedContact;
    },

    removeContactFromArray(user, contactId) {
        const newContactsArray =
            user.approved_contacts
                .filter(c => c.user.toString() !== contactId);
        user.approved_contacts = newContactsArray;
        return user.save();
    },

    addContactToArray(user, contactId, contactAliasName) {
        user.approved_contacts.push({
            contact_alias_name: contactAliasName,
            user: castToObjectId(contactId)
        });
        return user.save();
    },

    updateUserContactStatus(userIdToUpdate, contactId, status) {
        const UserModel = this;
        return UserModel
            .updateOne({ _id: castToObjectId(userIdToUpdate), approved_contacts: { $elemMatch: { user: castToObjectId(contactId) } } },
                { $set: { "approved_contacts.$.status": status } }
            )
            .exec();
    },

    async createMatchBetweenUsers(askingUser,
        approvingUser,
        approvingUserAliasName) {
        await askingUser.addContact(approvingUser, approvingUserAliasName);
        await approvingUser.addContact(askingUser, askingUser.name);
    },

    getUserByPhoneNumber(phoneNumber) {
        const UserModel = this;
        return UserModel.
            findOne({ phone_number: phoneNumber })
            .exec();
    },

    async removeUserContactsByPhoneNumbersList(userId, phoneNumbersList) {
        const userModel = this;
        const userIntance = await UserModel
            .findById(userId)
            .populate({
                path: 'approved_contacts.user',
                model: 'User',
                select: 'phone_number'
            }).exec();
        const newContactsArray = userInstance
            .approved_contacts
            .filter(contact =>
                !_.includes(phoneNumbersList, contact.user.phone_number));
        userInstance.approved_contacts = newContactsArray;
        return this.save();

    },

    getUserInformation(userId) {
        const UserModel = this;
        return UserModel
            .findOne({ _id: userId })
            .populate({
                path: 'approved_contacts.user',
                model: 'User',
                select: 'image_url phone_number name',
            })
            .exec();

    },
    serialize(userInformation, userPendingList, userWaitingList) {
        const { id, image_url, phone_number, name } = userInformation;
        let userData = { id, image_url, phone_number, name };
        userData.approved_contacts = userInformation.approved_contacts
            .toObject()
            .map(contact => {
                return Object.assign(
                    {
                        status: contact.status,
                        contact_alias_name: contact.contact_alias_name
                    }, contact.user);
            });
        userData.pending_list = userPendingList;
        userData.waiting_list = userWaitingList;
        return userData;
    }
};

mongoose.model('User', UserSchema);

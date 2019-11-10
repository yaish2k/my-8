const mongoose = require('mongoose');
const User = mongoose.model('User');
const { PHONE_VALIDATOR } = require('../utils/validators');
const Schema = mongoose.Schema;

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

    /**
     * all the contacts that the user requested (can be only from ContactRequest type) 
     * @param {*} askingUserId 
     * @returns [ContactRequest] list of requests created by the asking user
     */
    getUserWaitingList(askingUserId) {
        const ContactRequestModel = this;
        return ContactRequestModel
            .find({ asking_user: askingUserId })
            .select('target_phone_number target_contact_name status')
            .lean(true)
            .exec()
    },
    /**
     * all the contacts that waits for this user to confirm them
     * the user may not be exist thats why we use requestedUserPhoneNumber param 
     * (contacts must be only User type)
     * @param {*} requestedUserPhoneNumber 
     * @returns [User] list of asking users
     */
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

    /**
     * retrieve a contact request
     * @param {*} askingUser 
     * @param {*} targetPhoneNumber 
     * @returns ContactRequest instance
     */
    getContactRequest(askingUser, targetPhoneNumber, status) {
        const ContactRequestModel = this;
        return ContactRequestModel
            .findOne({
                asking_user: askingUser._id,
                target_phone_number: targetPhoneNumber,
                stauts: status
            }).exec();
    },

    /**
     * @param {*} decliningUser 
     * @param {*} askingPhoneNumber 
     */
    async declineContactRequest(decliningUser,
        askingPhoneNumber) {
        let askingUser;
        // fetch the asking user by the askingPhoneNumber

        askingUser = await User.getUserByPhoneNumber(askingPhoneNumber);
        if (!askingUser) {
            throw Error('User not found');
        }
        // get contact request for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            decliningUser.phone_number, status.PENDING)
        if (!contactRequest) {
            throw new Error("Contact request doesn't exist");
        }
        return contactRequest.changeStatus(status.DECLINED);
    },

    /**
     * @param {*} approvingUser 
     * @param {*} askingPhoneNumber 
     */
    approveContactRequest: async function (approvingUser,
        askingPhoneNumber) {
        const ContactRequestModel = this;
        let askingUser;
        // fetch the asking user by the askingPhoneNumber

        askingUser = await User.getUserByPhoneNumber(askingPhoneNumber);
        if (!askingUser) {
            throw Error('User not found');
        }
        // get contact request for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            approvingUser.phone_number, status.PENDING)
        if (!contactRequest) {
            throw new Error("Contact request doesn't exist");
        }

        const approvingUserContactAliasName = contactRequest.target_contact_name;
        try {
            contactRequest.remove();
        } catch (err) {
            throw Error('Failed to delete contact request');
        }

        try {
            askingUser.addContact(approvingUser, approvingUserContactAliasName);
            approvingUser.addContact(askingUser, askingUser.name)
        } catch (err) {
            throw Error('Failed to add contact to user contact list');
        }
    },
    /**
     * @param {*} askingUser 
     * @param {*} targetPhoneNumber 
     * @param {*} targetPhoneNumber 
     */
    createContactRequest: async function (askingUser,
        targetPhoneNumber,
        targetContactName) {
        const ContactRequestModel = this;

        // check if  contact request exists for the for asking user
        const contactRequest = await this.getContactRequest(askingUser,
            targetPhoneNumber, status.PENDING)
        if (contactRequest) {
            throw new Error('Contact request already exists');
        }

        // create and save new ContactRequest
        let newContactRequest = new ContactRequestModel({
            asking_user: askingUser._id,
            target_contact_name: targetContactName,
            target_phone_number: targetPhoneNumber,
        });
        return await newContactRequest.save();

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

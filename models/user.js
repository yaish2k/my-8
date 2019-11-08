const mongoose = require('mongoose');
const { PHONE_VALIDATOR, IMAGE_VALIDATOR, EMAIL_VALIDATOR } = require('../utils/validators');
validator = require('validator')
const Schema = mongoose.Schema;
/**
 * User Schema
 */

const UserSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    name: { type: String, default: '' },
    email: {
        unique: true,
        immutable: true,
        type: String,
        validate: EMAIL_VALIDATOR,
        required: [true, 'User email is required']
    },
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
            contact_alias_name: { type: String, default: '' }
        }
    ],
    pending_contacts_requests: [
        {
            created_at: { type: Date, default: Date.now },
            pending_req: { type: Schema.Types.ObjectId, ref: 'ContactRequest' }
        }
    ]
});

/**
 * Methods
 */

UserSchema.methods = {
    addContact(contactUser, contactAliasName) {
        this.approved_contacts.push({
            contact_alias_name: contactAliasName,
            user: contactUser._id
        });
        return this.save();
    },

    removeContact(contact) {
        const newContactsArray =
            this.approved_contacts
                .filter(c => c.user.toString() !== contact.id)

        this.approved_contacts = newContactsArray;
        return this.save();
    },

    addPendingContactRequest(newContactRequest) {
        this.pending_contacts_requests.push({
            pending_req: newContactRequest._id
        });
        return this.save();
    },

    removePendingContactRequest(request) {

        const newPendingRequestsArray =
            this.pending_contacts_requests
                .filter(pr => pr.pending_req.toString() !== request.id);
        this.pending_contacts_requests = newPendingRequestsArray;
        return this.save()

    },
    getUserInformation: function () {
        return this.findById(this.id)
            .populate({
                path: 'approved_contacts',
                populate: {
                    path: 'user',
                    model: 'User'
                }
            })
            .populate({
                path: 'pending_contacts_requests',
                populate: {
                    path: 'pending_req',
                    model: 'ContactRequest'
                }
            }).exec()
    }
}
/**
 * Statics
 */

UserSchema.statics = {
    /**
     * getUserInformation
     *
     * @param {Object} options
     * @param {Function} cb
     * @api private
     */

    createUser: function (body) {
        const UserModel = this;
        let newUser = new UserModel(body);
        return newUser.save();
    },

    editUser: function (userId, updatedFields) {
        const UserModel = this;
        return UserModel.update({ _id: userId }, updatedFields);
    },

    getUserByPhoneNumber: function (phoneNumber) {
        const UserModel = this;
        return UserModel.
            findOne({ phone_number: phoneNumber })
            .exec();
    },

};

mongoose.model('User', UserSchema);

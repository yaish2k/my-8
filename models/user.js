const mongoose = require('mongoose');
const { PHONE_VALIDATOR } = require('../utils/validators');
const Schema = mongoose.Schema;
/**
 * User Schema
 */

const UserSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    name: { type: String, default: '' },
    email: {
        unique: true,
        type: String,
        validate: {
            validator: email => {
                var emailRegex = /^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/;
                return emailRegex.test(email.text); // Assuming email has a text attribute
            },
            message: props => `${props.value} is not a valid email!`
        },
        required: [true, 'User email is required']
    },
    phone_number: {
        unique: true,
        type: String,
        validate: PHONE_VALIDATOR,
        required: [true, 'User phone number required']
    },
    image_url: {
        type: String,
        default: '',
        validate: {
            validator: imageUrl => {
                if (imageUrl) {
                    urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/;
                    return urlRegex.test(val);
                }
                return true;
            },
            message: props => 'Invalid Image URL.'
        }
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
        const index = this.approved_contacts.map(c => c.user.id).indexOf(contact.id);

        if (index !== -1) {
            this.approved_contacts.splice(index, 1);
            return this.save();
        } else {
            throw new Error('Contact not found');
        }
    },

    addPendingContactRequest(newContactRequest) {
        this.pending_contacts_requests.push({
            pending_req: newContactRequest._id
        });
        return this.save();
    },

    removePendingContactRequest(request) {
        const index = this.pending_contacts_requests
            .map(pr => pr.pending_req.id).indexOf(request.id);

        if (index !== -1) {
            this.pending_contacts_requests.splice(index, 1);
            return this.save();
        } else {
            throw new Error('Pending request not found');
        }
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

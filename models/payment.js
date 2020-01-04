const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
* PaymentPlan Schema
*/

const PaymentPlanSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    name: { type: String, required: true },
    price: { type: Number, default: 0 },
    calls_package: { type: Number, default: 0 },
    sms_package: { type: Number, default: 0 },
    gift: {
        amount_of_calls: { type: Number, default: 0 },
        amount_of_sms: { type: Number, default: 0 },
    }
})

mongoose.model('PaymentPlan', PaymentPlanSchema);
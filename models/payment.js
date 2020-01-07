const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { DatabaseError } = require('../utils/errors');
const { PurchaseHandler } = require('../utils/purchase');
const _ = require('lodash');

/**
* PaymentTransaction Schema
*/

const PaymentTransactionSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    transaction_id: { type: String, required: true, unique: true },
    payment_plan: { type: Schema.Types.ObjectId, ref: 'PaymentPlan' },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});

PaymentTransactionSchema.statics = {
    async getTransactionsByUser(user) {
        const PaymentTransactionModel = this;
        const userTransactions = PaymentTransactionModel.find({ user: user._id })
            .populate({
                path: 'payment_plan',
                model: 'PaymentPlan',
                select: 'name price'
            })
            .lean(true)
            .exec();
        return userTransactions;
    }
}
const PaymentTransactionModel = mongoose.model('PaymentTransaction', PaymentTransactionSchema);

/**
* PaymentPlan Schema
*/

const GIFT_TYPE = {
    CALLS: 'calls',
    SMS: 'sms'
}

const PaymentPlanSchema = new Schema({
    created_at: { type: Date, default: Date.now },
    name: { type: String, required: true, unique: true },
    price: { type: Number, default: 0 },
    calls_package: { type: Number, default: 0 },
    sms_package: { type: Number, default: 0 },
    gift: {
        amount_of_calls: { type: Number, default: 0 },
        amount_of_sms: { type: Number, default: 0 },
    }
})

PaymentPlanSchema.statics = {
    async getAllPlans() {
        const PaymentPlansModel = this;
        const plans = await PaymentPlansModel
            .find()
            .lean(true)
            .exec()
        return plans;
    },

    async validatePaymentReciept(paymentReciept) {
        try {
            return await PurchaseHandler.validate(paymentReciept);
        } catch (err) {
            return { isValidReciept: false, response: null };
        }
    },

    checkIfIsValidReciept(isValidReciept) {
        if (!isValidReciept) {
            throw new Error('Payment Reciept is not valid');
        }
    },
    validateAmountOfPurchases(listOfAllPurchases) {
        if (listOfAllPurchases.length === 0) {
            throw new Error('No Purchase detected');
        }
    },

    getRelatedPurchaseBygivenTransactionId(listOfAllPurchases, sourceTransactionId) {
        const relatedPurchase = _.find(listOfAllPurchases, (purchaseItem) =>
            purchaseItem.transactionId === sourceTransactionId)
        if (_.isNil(relatedPurchase)) {
            throw new Error("Cannot find purchase item by given transaction");
        }
        return relatedPurchase;
    },

    validatePaymentPlanType(relatedPurchase, givenPlanType) {
        if (relatedPurchase.productId !== givenPlanType) {
            throw new Error("Source plan type id doesn't match to the destination");
        }
    },
    async buyUserCredits(buyingUser,
        transactionId, planType, giftType, paymentReciept) {
        const PaymentPlansModel = this;
        const { isValidReciept, response } =
            await PaymentPlansModel.validatePaymentReciept(paymentReciept);
        PaymentPlansModel.checkIfIsValidReciept(isValidReciept);
        const listOfAllPurchases = PurchaseHandler.getPurchaseData(response);
        PaymentPlansModel.validateAmountOfPurchases(listOfAllPurchases);
        const relatedPurchase =
            PaymentPlansModel.getRelatedPurchaseBygivenTransactionId(listOfAllPurchases, transactionId);
        PaymentPlansModel.validatePaymentPlanType(relatedPurchase, planType);
        let paymentPlan
        try {
            paymentPlan = await PaymentPlansModel.findOne({ name: planType }).exec();
        } catch (err) {
            throw new DatabaseError('Plan type not found');
        }

        PaymentPlansModel.addPlanCreditsToUser(buyingUser, paymentPlan);
        PaymentPlansModel.addGiftCreditsToUser(buyingUser, paymentPlan, giftType);
        const paymentTransaction = new PaymentTransactionModel({
            transaction_id: transactionId,
            payment_plan: paymentPlan._id,
            user: buyingUser._id
        });
        await paymentTransaction.save();
        await buyingUser.save();

    },


    async addPlanCreditsToUser(buyingUser, paymentPlan) {
        buyingUser.increaseAmountOfTotalSmsCredits(paymentPlan.sms_package, false);
        buyingUser.increaseAmountOfSmsCredits(paymentPlan.sms_package, false);
        buyingUser.increaseAmountOfTotalCallsCredits(paymentPlan.calls_package, false)
        buyingUser.increaseAmountOfCallsCredits(paymentPlan.calls_package, false);
    },

    async addGiftCreditsToUser(buyingUser, paymentPlan, giftType) {
        if (paymentPlan.gift) {
            if (giftType === GIFT_TYPE.CALLS) {
                buyingUser.increaseAmountOfTotalCallsCredits(paymentPlan.gift.amount_of_calls, false)
                buyingUser.increaseAmountOfCallsCredits(paymentPlan.gift.amount_of_calls, false);
            } else if (giftType === GIFT_TYPE.SMS) {
                buyingUser.increaseAmountOfTotalSmsCredits(paymentPlan.gift.amount_of_sms, false);
                buyingUser.increaseAmountOfSmsCredits(paymentPlan.gift.amount_of_sms, false);
            }
        }

    }
}
mongoose.model('PaymentPlan', PaymentPlanSchema);


const mongoose = require('mongoose');
const User = mongoose.model('User');
const Call = mongoose.model('Call');
const SMS = mongoose.model('SMS');
const PaymentPlan = mongoose.model('PaymentPlan');
const nexmoSettings = require('./config/index').nexmo;
const { PurchaseHandler } = require('./utils/purchase');

async function migrateAll() {
    // await performEditOperations();
    // await performCreateOperations();
    // await testOperations4();
}

async function testOperations() {
    const user = await User.findOne({ phone_number: "+15058881006" }).exec();
    console.log(user);
    user.credits.amount_of_calls = 3;
    try {
        updatedUser = await user.save();
        console.log(updatedUser.credits.amount_of_calls)
    } catch (err) {
        console.log(err);
    }

}

async function testOperations2() {
    const user = await User.findOne({ phone_number: "+15058881006" }).exec();
    messages = await SMS.find({ sender: user._id })
        .populate({
            path: 'reciever',
            model: 'User',
            select: 'name',
        })
        .lean(true)
        .exec();

    serializedMessages = messages.map(m => ({
        date: m.created_at.toLocaleDateString(),
        name: m.reciever.name,
        collected: m.is_collected
    }));
    console.log(serializedMessages);
}

async function testOperations3() {
    const user = await User.findOne({ phone_number: "+15058881006" }).exec();
    calls = await Call.find({ caller: user._id })
        .populate({
            path: 'reciever',
            model: 'User',
            select: 'name',
        })
        .lean(true)
        .exec();

    seiralizedCalls = calls.map(call => ({
        date: call.created_at.toLocaleDateString(),
        name: call.reciever.name,
        collected: call.is_collected
    }));
    console.log(seiralizedCalls);
}

async function testOperations4() {
    reciept = "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";
    PurchaseHandler.validate(reciept)
}

async function performEditOperations() {
    await migrateUserCreditsToBase();
    await migrateCallsAndSmsIsCollectedFieldToFalse();
}

async function performCreateOperations() {
    await createAllPaymentPackages();
}

async function performDeleteOperations() {

}

// CREATE

async function createAllPaymentPackages() {
    const lite = new PaymentPlan({
        name: 'lite_package',
        price: 1.99,
        calls_package: 20,
        sms_package: 10,
    });
    await lite.save();

    const brilliant = new PaymentPlan({
        name: 'brilliant_package',
        price: 2.99,
        calls_package: 30,
        sms_package: 20,
        gift: {
            amount_of_calls: 35,
            amount_of_sms: 15,
        }
    });

    await brilliant.save();

    const premium = new PaymentPlan({
        name: 'premium_package',
        price: 5.99,
        calls_package: 50,
        sms_package: 40,
        gift: {
            amount_of_calls: 70,
            amount_of_sms: 30,
        }
    });

    await premium.save();

}

// EDIT

async function migrateCallsAndSmsIsCollectedFieldToFalse() {
    await SMS.update({},
        {
            $set:
            {
                is_collected: false
            }
        }, { multi: true });

    await Call.update({},
        {
            $set:
            {
                is_collected: false
            }
        }, { multi: true });
}
async function migrateUserCreditsToBase() {
    await User.update({},
        {
            $set:
            {
                credits: {
                    amount_of_calls: nexmoSettings.CALL.CALLS_MAX_BALANCE,
                    remaining_calls: nexmoSettings.CALL.CALLS_MAX_BALANCE,
                    amount_of_sms: nexmoSettings.SMS.MESSAGES_MAX_BALANCE,
                    remaining_sms: nexmoSettings.SMS.MESSAGES_MAX_BALANCE,
                }
            }
        }, { multi: true })
}

module.exports = {
    migrateAll
}
const iap = require('in-app-purchase');
const { promisify } = require('./utilities');

class PurchaseHandler {
    static async setup() {
        iap.config({
            verbose: true
        });
        try {
            await promisify(iap.setup.bind(iap));
        } catch (err) {
            throw new Error('Purchase setup failed');
        }
    }

    static async validate(receipt) {
        await this.setup();
        try {
            const response = await promisify(iap.validate.bind(iap), receipt);
            const isValidReciept = iap.isValidated(response);
            return { isValidReciept, response };
        } catch (err) {
            throw new Error('Receipt is not valid')
        }
    }

    static getPurchaseData(response) {
        return iap.getPurchaseData(response);
    }
}
module.exports = {
    PurchaseHandler
}
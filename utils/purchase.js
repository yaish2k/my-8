const inAppPurchase = require('in-app-purchase');
const promisify = require('./utilities');

class PurchaseHandler {
    static async setup() {
        try {
            await promisify(inAppPurchase.setup.bind(inAppPurchase));
        } catch (err) {
            throw new Error('Purchase setup failed');
        }
    }

    static async validate(receipt) {
        try  {
            const response = await promisify(inAppPurchase.validate.bind(inAppPurchase), receipt);
            return inAppPurchase.isValidated(response);
        } catch (err) {
            throw new Error('Receipt is not valid')
        }

        
    }
}
const dotenv = require('dotenv');
dotenv.config();
const { NexmoHandler } = require('./utils/nexmo');
const config = require('./config/index');
NexmoHandler.sendTextToSpeach('gal', '++asda');
// NexmoHandler.sendSmsMessage('sender is gal', '++dasda')
// p = new Promise((resolve, reject) => {
//     throw new Error('something wrong');
// })

// const x = async () => {
//     throw new Error('wrong');
// }

// x()
// .then(m => console.log(m))
// .catch(error => {
//     throw error;
// })
// .catch(error => {
//     console.log(error.message);
// })

// p.then(x =>  {
//     console.log(x);
// })
// .catch(err => {
//     console.log(err.message);
// })
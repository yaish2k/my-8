const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const castToObjectId = (id) => {
    if (typeof id === 'string') {
        return mongoose.Types.ObjectId(id);
    }
    return id;
}

const castToId = (objectId) => {
    if (typeof objectId !== 'string') {
        return objectId.toString();
    }
    return objectId;
}
const promisify = (fn, ...args) => {
    return new Promise((resolve, reject) => {
        fn(...args, (res, err) => {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        })
    })
}

module.exports = {
    castToObjectId,
    promisify,
    castToId
}
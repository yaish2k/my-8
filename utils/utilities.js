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

module.exports ={
    promisify
}
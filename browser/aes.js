
/**
 * 
 * @param {string} data 
 * @param {String} passphrase 
 * @returns Promise resolves to {string} cipher
 */
function passphraseEnc(data, passphrase) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('/javascripts/workers/aes-enc.bundle.js');
        worker.onmessage = function (e) {
            if (e.data instanceof Error) {
                reject(e.data);
            } else {
                resolve(e.data);
            }
            worker.terminate();
        }
        worker.postMessage({ data, passphrase });
    });
}

/**
 * 
 * @param {String} cipher 
 * @param {String} passphrase 
 * @returns Promise resolves to {string} data
 */
function passphraseDec(cipher, passphrase) {
    return new Promise((resolve, reject) => {
        const worker = new Worker('/javascripts/workers/aes-dec.bundle.js');
        worker.onmessage = function (e) {
            if (e.data instanceof Error) {
                reject(e.data);
            } else {
                resolve(e.data);
            }
            worker.terminate();
        }
        worker.postMessage({ cipher, passphrase });
    });
}

module.exports = { passphraseEnc, passphraseDec };

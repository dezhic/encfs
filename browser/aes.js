
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
            resolve(e.data);
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
        CryptoJS.AES.decrypt(cipher, passphrase).toString();
    });
}

module.exports = { passphraseEnc, passphraseDec };

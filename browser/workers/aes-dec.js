const CryptoJS = require("crypto-js");

onmessage = function (e) {
    try {
        postMessage(CryptoJS.AES.decrypt(e.data.cipher, e.data.passphrase).toString(CryptoJS.enc.Base64));
    } catch (err) {
        postMessage(err);
    }
}

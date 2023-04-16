const CryptoJS = require("crypto-js");

onmessage = function (e) {
    postMessage(CryptoJS.AES.decrypt(e.data.cipher, e.data.passphrase).toString(CryptoJS.enc.Base64));
}

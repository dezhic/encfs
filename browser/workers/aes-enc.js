const CryptoJS = require("crypto-js");

onmessage = function (e) {
    postMessage(CryptoJS.AES.encrypt(e.data.data, e.data.passphrase).toString());
}

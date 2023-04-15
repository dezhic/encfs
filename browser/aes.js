const CryptoJS = require("crypto-js");

function passphraseEnc(data, pass) {
    console.log("passphraseEnc called");
}

function passphraseDec(cipher, pass) {
    console.log("passphraseDec called");
}

module.exports = { passphraseEnc, passphraseDec };

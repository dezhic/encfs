const CryptoJS = require("crypto-js");

function passphraseEnc(data, pass) {
    console.log("passphraseEnc called");
}

global.window.passphraseEnc = passphraseEnc;

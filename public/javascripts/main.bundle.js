(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

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

},{}],2:[function(require,module,exports){
(function (global){(function (){
const { arrayBufferToBase64 } = require("./utils");

function generateKeyPair() {
    return window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: { name: "SHA-256" },
        },
        true,
        ["encrypt", "decrypt"]
    );
}

var privB64, pubB64;
// Generate public key and private key
$('#generateKeyPairBtn').click(function () {
    generateKeyPair().then((keyPair) => {
        window.crypto.subtle.exportKey(
            "spki",
            keyPair.publicKey
        ).then((publicKey) => {
            console.log('pubKey before encoding');
            console.log(new Uint8Array(publicKey));
            pubB64 = arrayBufferToBase64(publicKey);
            $('#publicKeyTextarea').val(pubB64);
        });
        window.crypto.subtle.exportKey(
            "pkcs8",
            keyPair.privateKey
        ).then((privateKey) => {
            privB64 = arrayBufferToBase64(privateKey);
            $('#privateKeyTextarea').val(privB64);
        });
    });
});

$('#saveKeyBtn').click(function () {
    let allKeys = JSON.parse(localStorage.getItem('keys'));
    if (allKeys == null) {
        allKeys = [];
    }

    let type = $('input[name="genKeyType"]:checked').val();
    let label = $('#keyLabelInput').val();

    if (label === '') {
        alert('Please enter a label.');
        return;
    }

    if (allKeys.some((key) => key.label === label)) {
        alert('Label already exists.');
        return;
    }

    if (type === 'publicKey') {
        if (pubB64 == null || privB64 == null) {
            alert('Please generate a key pair first.');
            return;
        }
        allKeys.push({
            label: label,
            type: "RSA Public Key",
            content: pubB64,
        });
        allKeys.push({
            label: label,
            type: "RSA Private Key",
            content: privB64,
        });
    } else if (type === 'passphrase') {
        if ($('#passphraseInput').val() === '') {
            alert('Please enter a passphrase.');
            return;
        }
        allKeys.push({
            label: label,
            type: "Passphrase",
            content: $('#passphraseInput').val(),
        });
    }

    localStorage.setItem('keys', JSON.stringify(allKeys));

    $('#keyGenerationModal').modal('hide');
    renderKeyTable();
});

global.window.generateKeyPair = generateKeyPair;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./utils":6}],3:[function(require,module,exports){
require('./upload');
require('./keygen');
},{"./keygen":2,"./upload":5}],4:[function(require,module,exports){
(function (global){(function (){
function rsaEnc(data, pubKey) {
    console.log('pubKey in Enc');
    console.log(new Uint8Array(pubKey));

    return new Promise((resolve, reject) => {
        global.window.crypto.subtle.importKey(
            "spki",
            pubKey,
            {
                name: "RSA-OAEP",
                hash: { name: "SHA-256" },
            },
            true,
            ["encrypt"]
        ).then((key) => {
            console.log(typeof(data));
            console.log(data);
            global.window.crypto.subtle.encrypt(
                {
                    name: "RSA-OAEP",
                },
                key,
                data
            ).then((cipher) => {
                resolve(cipher);
            }).catch((err) => {
                console.log(err);
            });
        }
        ).catch((err) => {
            console.log(err);
        });
    });
}

function rsaDec(cipher, privKey) {
    return new Promise((resolve, reject) => {
        global.window.crypto.subtle.importKey(
            "pkcs8",
            privKey,
            {
                name: "RSA-OAEP",
                hash: { name: "SHA-256" },
            },
            true,
            ["decrypt"]
        ).then((key) => {
            global.window.crypto.subtle.decrypt(
                {
                    name: "RSA-OAEP",
                },
                key,
                cipher
            ).then((data) => {
                resolve(data);
            });
        }
        );
    });
}

module.exports = { rsaEnc, rsaDec };

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],5:[function(require,module,exports){
const { passphraseEnc, passphraseDec } = require("./aes");
const { rsaEnc, rsaDec } = require("./rsa");
const { base64ToArrayBuffer, arrayBufferToBase64 } = require("./utils");

let fileContent;
let fileMetadata;

$('#uploadFileInput').change(function () {
    let file = this.files[0];
    if (file == null) {
        fileContent = null;
        fileMetadata = null;
        $('#encNameInput').val("");
        return;
    }

    // Set default encrypted file name
    let filename = file.name;
    let parts = filename.split('.');
    let encName;
    if (parts.length === 1) {
        encName = filename + '.enc';
    } else {
        encName = parts.slice(0, parts.length - 1).join('.') + '.enc';
    }
    $('#encNameInput').val(encName);

    // Get file metadata
    fileMetadata = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
    };

    // Read file content
    let reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = function (e) {
        fileContent = e.target.result;
    }
});


let contentCipher, metadataCipher;
$("#modal-upload-btn").click(function () {
    if (fileContent == null || fileMetadata == null) {
        alert("Please select a file to upload.");
        return;
    }

    let keyType = $('input[name="uploadKeyType"]:checked').val();
    let keyIdx = $("#upload-key-select").val();
    if (keyIdx === null) {
        alert("Please select a key.");
        return;
    }
    let key = JSON.parse(localStorage.getItem('keys'))[keyIdx];

    $('#modal-upload-btn').prop('disabled', true);
    $('#modal-upload-btn').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Encrypting...');

    if (keyType === 'passphrase') {
        let passphrase = key.content;
        passphraseEnc(JSON.stringify(fileMetadata), passphrase).then((cipher) => {
            metadataCipher = cipher;
            console.log("metadataCipher: ");
            console.log(metadataCipher);
        });

        passphraseEnc(arrayBufferToBase64(fileContent), passphrase).then((cipher) => {
            contentCipher = cipher;
            console.log("contentCipher: ");
            console.log(contentCipher);
            $('#modal-upload-btn').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...');
        });

    } else if (keyType === 'publicKey') {
        let publicKey = base64ToArrayBuffer(key.content);

        rsaEnc(base64ToArrayBuffer(btoa(JSON.stringify(fileMetadata))), publicKey).then((cipher) => {
            metadataCipher = cipher;
            console.log("metadataCipher: ");
            console.log(metadataCipher);
            rsaEnc(fileContent, publicKey).then((cipher) => {
                contentCipher = cipher;
                console.log("contentCipher: ");
                console.log(contentCipher);
                $('#modal-upload-btn').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...');
            });
        });


    } else {
        alert("Please select an encryption type.");
        return;
    }


});

},{"./aes":1,"./rsa":4,"./utils":6}],6:[function(require,module,exports){
module.exports.arrayBufferToBase64 = function (buffer) {
    return btoa(new Uint8Array(buffer));
};

module.exports.base64ToArrayBuffer = function (base64) {
    return new Uint8Array(atob(base64).split(',')).buffer;
}

},{}]},{},[3]);

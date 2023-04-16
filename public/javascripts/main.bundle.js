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

},{}],2:[function(require,module,exports){
(function (global){(function (){
const { passphraseDec } = require("./aes");
const { rsaDec } = require("./rsa");
const { base64ToArrayBuffer, arrayBufferToBase64 } = require("./utils");

let metadataCipher;
let contentCipher;
let metadataPlain;
let contentPlain;
function renderDownloadKeyOptions() {
    // Clear previous options in key select
    $("#download-key-select").empty();
    $("#download-key-select").append($('<option>', {
        value: "",
        text: "Select a Key",
        disabled: true,
        selected: true
    }));

    // Add options for each row in tableLeft
    $("#tableLeft tbody tr").each(function (index) {
        // filter key type
        // not using .filter() because we want to keep the index
        var type = $(this).find(".type-cell").text();
        if ($('#download-type-text').text() === 'Passphrase') {
            if (type !== "Passphrase") {
                return;
            }
        } else {
            if (type !== "RSA Private Key") {
                return;
            }
        }

        var label = $(this).find(".label-cell").text();
        var key = label + "-" + type;

        $("#download-key-select").append($('<option>', {
            value: index,
            text: key
        }));
    });
}

function downloadMetadata(filename) {
    $.get("/metadata", { filename: filename }, function (data, status) {
        if (data.status === "error") {
            alert(data.message);
        } else {
            metadataCipher = data.data.metadataCipher;
            console.log("metadataCipher: ");
            console.log(metadataCipher);
        }
    });
}

function saveFile(file, metadata) {
    // write file to disk
    var blob = new Blob([file], { type: metadata.type });
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = metadata.name;
    link.click();
    // reset button
    $('#modal-download-btn').prop('disabled', false);
    $('#modal-download-btn').text('Download');
}

function downloadContent(filename, metadata, type, key) {

    $('#modal-download-btn').prop('disabled', true);
    $('#modal-download-btn').text('Downloading...');
    $.get("/content", { filename: filename }, function (data, status) {
        if (data.status === "error") {
            alert(data.message);

        } else {
            contentCipher = data.data.contentCipher;

            $('#modal-download-btn').text('Decrypting...');
            if (type === "Passphrase") {
                passphraseDec(contentCipher, key.content).then((plain) => {
                    contentPlain = atob(plain);  // AES output (base64) -> plain text (base64)
                    contentPlain = base64ToArrayBuffer(contentPlain); // plain text (base64) -> plain text (arrayBuffer)
                    saveFile(contentPlain, metadata);
                }).catch((err) => {
                    console.log("passphraseDec error: ")
                    console.log(err);
                    alert(err);
                });

            } else {
                passphraseDec(contentCipher, metadata.secret).then((plain) => {
                    contentPlain = atob(plain);  // AES output (base64) -> plain text (base64)
                    contentPlain = base64ToArrayBuffer(contentPlain); // plain text (base64) -> plain text (arrayBuffer)
                    saveFile(contentPlain, metadata);
                }).catch((err) => {
                    console.log("passphraseDec error: ")
                    console.log(err);
                    alert(err);
                });
            }
        }
    });

}

// Handle click on Download button
$("#download-btn").on("click", function () {
    // Get filename, encryption type, and key label
    var selected = $("#tableRight tbody tr[data-key='" + selectedKeyRight + "']");
    var filename = selected.find(".filename-cell").text();
    var type = selected.find(".type-cell").text();
    var label = selected.find(".label-cell").text();

    // Set filename text in modal
    $("#download-filename-text").text(filename);
    $("#download-type-text").text(type);
    $("#download-label-text").text(label);

    renderDownloadKeyOptions();

    downloadMetadata(filename);

    // Show modal
    $("#downloadModal").modal("show");
});

// Handle click on Download button in modal
$("#modal-download-btn").on("click", function () {
    var selected = $("#tableRight tbody tr[data-key='" + selectedKeyRight + "']");
    var filename = selected.find(".filename-cell").text();
    var type = selected.find(".type-cell").text();
    
    // Get key
    var keyIndex = $("#download-key-select").val();
    if (!keyIndex) {
        alert("Please select a key.");
        return;
    }
    var key = JSON.parse(localStorage.getItem('keys'))[keyIndex];

    // Disable button and change text
    $("#modal-download-btn").prop("disabled", true);
    $("#modal-download-btn").html(
        '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Verifying...'
    );

    // Try decrypting metadata first
    if (type === "Passphrase") {
        passphraseDec(metadataCipher, key.content).then((plain) => {
            metadataPlain = JSON.parse(atob(plain));
            downloadContent(filename, metadataPlain, type, key);
        }).catch((err) => {
            console.log(err);
            alert("Incorrect passphrase.");
            $("#modal-download-btn").prop("disabled", false);
            $("#modal-download-btn").html("Download");
            return;
        });
    } else {
        global.window.metadataCipher = metadataCipher;
        global.window.key = key;
        rsaDec(base64ToArrayBuffer(metadataCipher), key.content).then((plain) => {
            metadataPlain = new TextDecoder().decode(plain);
            metadataPlain = JSON.parse(metadataPlain);
            downloadContent(filename, metadataPlain, type, key);
        }).catch((err) => {
            console.log(err);
            alert("Incorrect private key.");
            $("#modal-download-btn").prop("disabled", false);
            $("#modal-download-btn").html("Download");
            return;
        });
    }

});

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./aes":1,"./rsa":5,"./utils":7}],3:[function(require,module,exports){
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

// Generate public key and private key
$('#generateKeyPairBtn').click(function () {
    let privB64, pubB64;
    generateKeyPair().then((keyPair) => {
        window.crypto.subtle.exportKey(
            "spki",
            keyPair.publicKey
        ).then((publicKey) => {
            console.log('pubKey before encoding');
            console.log(new Uint8Array(publicKey));
            pubB64 = arrayBufferToBase64(publicKey);
            $('#publicKeyTextarea').val(pubB64).prop('readonly', true);
        });
        window.crypto.subtle.exportKey(
            "pkcs8",
            keyPair.privateKey
        ).then((privateKey) => {
            privB64 = arrayBufferToBase64(privateKey);
            $('#privateKeyTextarea').val(privB64).prop('readonly', true);
        });
    });
});

$('#saveKeyBtn').click(function () {
    let pubB64 = $('#publicKeyTextarea').val();
    let privB64 = $('#privateKeyTextarea').val();
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
            alert('Please generate or input a key pair first.');
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
},{"./utils":7}],4:[function(require,module,exports){
require('./upload');
require('./keygen');
require('./download');
},{"./download":2,"./keygen":3,"./upload":6}],5:[function(require,module,exports){
(function (global){(function (){
const { base64ToArrayBuffer } = require("./utils");

function rsaEnc(data, pubKey) {
    pubKey = base64ToArrayBuffer(pubKey);
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
                reject(err);
            });
        }
        ).catch((err) => {
            console.log(err);
            reject(err);
        });
    });
}

/**
 * 
 * @param {ArrayBuffer} cipher
 * @param {String} privKey base64 encoded
 * @returns 
 */
function rsaDec(cipher, privKey) {
    privKey = base64ToArrayBuffer(privKey);
    return new Promise((resolve, reject) => {
        const worker = new Worker('/javascripts/workers/rsa-dec.bundle.js');
        worker.onmessage = function (e) {
            if (e.data instanceof Error) {
                reject(e.data);
            } else {
                resolve(e.data);
            }
            worker.terminate();
        }
        worker.postMessage({ cipher, privKey });
    });
}

module.exports = { rsaEnc, rsaDec };

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./utils":7}],6:[function(require,module,exports){
(function (global){(function (){
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

    function upload() {
        // Upload file
        let filename = $('#encNameInput').val();
        $.ajax({
            url: "/upload",
            type: "POST",
            data: JSON.stringify({
                filename: filename,
                contentCipher: contentCipher,
                metadataCipher: metadataCipher,
                keyType: keyType,
                keyLabel: key.label
            }),
            contentType: "application/json",
            success: function (data, status) {
                if (data.status === "error") {
                    alert(data.message);
                } else {
                    $('#uploadModal').modal('hide');
                    $('#modal-upload-btn').html('Upload');
                    $('#modal-upload-btn').prop('disabled', false);
                    refreshFileList();
                    alert("File uploaded successfully.");
                }
            }
        });
    }

    if (keyType === 'passphrase') {
        let passphrase = key.content;
        passphraseEnc(JSON.stringify(fileMetadata), passphrase).then((cipher) => {
            metadataCipher = cipher;
            console.log("metadataCipher: ");
            console.log(metadataCipher);
            passphraseEnc(arrayBufferToBase64(fileContent), passphrase).then((cipher) => {
                contentCipher = cipher;
                console.log("contentCipher: ");
                console.log(contentCipher);
                $('#modal-upload-btn').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...');
                upload();
            });
        });


    } else if (keyType === 'publicKey') {  // We use the hybrid encryption scheme RSA + AES
        // Generate symmetric key (passphrase), equivalent to AES-256
        let secret = window.crypto.getRandomValues(new Uint8Array(32)).join('');
        // Append to the metadata
        fileMetadata.secret = secret;
        let metadataArrayBuffer = new TextEncoder().encode(JSON.stringify(fileMetadata)).buffer;
        global.window.metadataArrayBuffer = metadataArrayBuffer;
        rsaEnc(metadataArrayBuffer, key.content).then((cipher) => {
            metadataCipher = arrayBufferToBase64(cipher);
            console.log("metadataCipher: ");
            console.log(metadataCipher);
            passphraseEnc(arrayBufferToBase64(fileContent), secret).then((cipher) => {
                contentCipher = cipher;
                console.log("contentCipher: ");
                console.log(contentCipher);
                $('#modal-upload-btn').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...');
                upload();
            });
        }).catch((err) => {
            alert("Error: " + err + ". Maybe you selected an invalid key.");
            $('#modal-upload-btn').html('Upload');
            $('#modal-upload-btn').prop('disabled', false);
        });

    } else {
        alert("Please select an encryption type.");
        return;
    }


});

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./aes":1,"./rsa":5,"./utils":7}],7:[function(require,module,exports){
module.exports.arrayBufferToBase64 = function (buffer) {
    return btoa(new Uint8Array(buffer));
};

module.exports.base64ToArrayBuffer = function (base64) {
    return new Uint8Array(atob(base64).split(',')).buffer;
}

},{}]},{},[4]);

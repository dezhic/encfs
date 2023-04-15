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

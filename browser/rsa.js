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

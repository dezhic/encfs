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

onmessage = function (e) {
    const { cipher, privKey } = e.data;
    self.crypto.subtle.importKey(
        "pkcs8",
        privKey,
        {
            name: "RSA-OAEP",
            hash: { name: "SHA-256" },
        },
        true,
        ["decrypt"]
    ).then((key) => {
        console.log('rsaDec cipher');
        console.log(cipher);

        self.crypto.subtle.decrypt(
            {
                name: "RSA-OAEP",
            },
            key,
            cipher
        ).then((data) => {
            console.log('rsaDec decrypted data');
            console.log(data);
            // this.postMessage(new Uint8Array([1,2,3,4,5,6,7,8,9,10]).buffer);
            this.postMessage(data);
        }).catch((err) => {
            console.log(err);
            this.postMessage(err);
        });
    });
}

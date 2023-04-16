(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}]},{},[1]);

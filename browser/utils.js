module.exports.arrayBufferToBase64 = function (buffer) {
    return btoa(new Uint8Array(buffer));
};

module.exports.base64ToArrayBuffer = function (base64) {
    return new Uint8Array(atob(base64).split(',')).buffer;
}

module.exports.arrayBufferToBase64 = function (buffer) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)))
};
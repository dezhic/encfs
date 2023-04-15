const { passphraseEnc, passphraseDec } = require("./aes");
const { rsaEnc, rsaDec } = require("./rsa");

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

    if (keyType === 'passphrase') {
        let passphrase = key.content;
        contentCipher = passphraseEnc(fileContent, passphrase);
        metadataCipher = passphraseEnc(JSON.stringify(fileMetadata), passphrase);
    } else if (keyType === 'publicKey') {
        let publicKey = key.content;
        contentCipher = rsaEnc(fileContent, publicKey);
        metadataCipher = rsaEnc(JSON.stringify(fileMetadata), publicKey);
    } else {
        alert("Please select an encryption type.");
        return;
    }


});

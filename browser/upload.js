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
                    alert("File uploaded successfully.");
                    $('#modal-upload-btn').html('Upload');
                    $('#modal-upload').modal('hide');
                    location.reload();
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


    } else if (keyType === 'publicKey') {
        let publicKey = base64ToArrayBuffer(key.content);

        rsaEnc(base64ToArrayBuffer(btoa(JSON.stringify(fileMetadata))), publicKey).then((cipher) => {
            metadataCipher = arrayBufferToBase64(cipher);
            console.log("metadataCipher: ");
            console.log(metadataCipher);
            rsaEnc(fileContent, publicKey).then((cipher) => {
                contentCipher = arrayBufferToBase64(cipher);
                console.log("contentCipher: ");
                console.log(contentCipher);
                $('#modal-upload-btn').html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...');
                upload();
            });
        });


    } else {
        alert("Please select an encryption type.");
        return;
    }


});

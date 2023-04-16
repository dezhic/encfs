const { passphraseDec } = require("./aes");
const { rsaDec } = require("./rsa");
const { base64ToArrayBuffer } = require("./utils");

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
                    alert(err);
                });

            } else {
                rsaDec(contentCipher, key.content).then((plain) => {
                    contentPlain = atob(plain);
                    console.log("contentPlain: ");
                    console.log(atob(contentPlain));
                    saveFile(contentPlain, metadata);
                }).catch((err) => {
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
        // TODO
    }

});

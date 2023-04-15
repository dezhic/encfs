const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./repository.db', (err) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }
});


module.exports = {

    upload: async function (req, res) {
        let filename = req.body.filename;
        let contentCipher = req.body.contentCipher;
        let metadataCipher = req.body.metadataCipher;
        let keyType = req.body.keyType;
        let keyLabel = req.body.keyLabel;

        db.run('INSERT INTO Repository (filename, content_cipher, metadata_cipher, key_type, key_label) VALUES (?, ?, ?, ?, ?)', [filename, contentCipher, metadataCipher, keyType, keyLabel], function (err) {
            if (err) {
                res.json({ status: "error", message: err.message });
            }
            res.json({ status: "success" });
        });
    },

    list: async function (req, res) {
        db.all('SELECT filename, key_type AS type, key_label AS label FROM Repository', [], (err, rows) => {
            if (err) {
                res.json({ status: "error", message: err.message });
            }
            res.json({ status: "success", data: rows });
        });
    },

}

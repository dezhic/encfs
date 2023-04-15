CREATE TABLE Repository (
    filename TEXT,
    content_cipher TEXT NOT NULL,
    metadata_cipher TEXT NOT NULL,
    key_type TEXT NOT NULL,
    key_label TEXT NOT NULL,
    PRIMARY KEY (filename)
);

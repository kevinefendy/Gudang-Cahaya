import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (_req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
        callback(null, true);
    } else {
        callback(new Error("File harus berupa gambar"));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export default upload;

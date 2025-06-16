const multer = require("multer");

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();

// File filter to accept only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Not a PDF file!"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 MB limit for PDF files
  },
});

module.exports = upload;

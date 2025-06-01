const axios = require("axios");
const multer = require("multer");

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const summarizePdfController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    // The ML service expects the raw file buffer
    const mlServiceUrl = "http://localhost:8000/summarize"; // Ensure your Python service is running here

    const response = await axios.post(mlServiceUrl, req.file.buffer, {
      headers: {
        // The Python service's summarize_pdf function seems to expect the raw content,
        // which implies 'application/octet-stream' or letting axios determine it.
        // If it specifically needs 'application/pdf', uncomment the line below.
        // 'Content-Type': 'application/pdf',
        "Content-Type": req.file.mimetype, // Or more generically: 'application/octet-stream'
      },
      // If the Python service expects a specific field name for the file, adjust accordingly.
      // For FastAPI UploadFile, sending the buffer directly as data is usually correct.
    });

    res.json(response.data); // Assuming the ML service returns { "summary": "..." }
  } catch (error) {
    console.error("Error calling ML service:", error.message);
    if (error.response) {
      console.error("ML Service Response:", error.response.data);
      return res.status(error.response.status || 500).json({
        error: "Error from ML service.",
        details: error.response.data,
      });
    }
    res
      .status(500)
      .json({ error: "Failed to summarize PDF.", details: error.message });
  }
};

module.exports = {
  summarizePdfController,
  upload, // Export multer instance for the route
};

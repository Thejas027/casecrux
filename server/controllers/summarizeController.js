const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data"); // Added

// Configure multer for in-memory file storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const summarizePdfController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  try {
    const mlServiceUrl = "https://casecrux.onrender.com/summarize";

    // Create a new FormData instance
    const formData = new FormData();
    // Append the file buffer. The field name 'file' must match what FastAPI expects.
    // We also pass the original filename, which can be useful for the server.
    formData.append("file", req.file.buffer, {
      filename: req.file.originalname,
    });

    const response = await axios.post(mlServiceUrl, formData, {
      headers: {
        // Let FormData set the Content-Type header, including the boundary
        ...formData.getHeaders(),
      },
      timeout: 300000, // Added: 5 minutes timeout
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

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Example route
app.get("/", (req, res) => res.send("API Running"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Hello route
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Import and use the summarize routes (old features)
const summarizeRoutes = require("./routes/summarizeRoutes");
app.use("/api", summarizeRoutes);

// Import and use the cloudinaryUpload route (category-based upload)
const cloudinaryUpload = require("./routes/cloudinaryUpload");
app.use("/api", cloudinaryUpload);

// Import and use the cloudinaryListFilesByCategory route (list PDFs by category)
const cloudinaryListFilesByCategory = require("./routes/cloudinaryListFilesByCategory");
app.use("/api", cloudinaryListFilesByCategory);

// Import and use the listUploadedPdfsByCategory route (list uploaded PDFs by category from MongoDB)
const listUploadedPdfsByCategory = require("./routes/listUploadedPdfsByCategory");
app.use("/api", listUploadedPdfsByCategory);

// Test MongoDB insert route
const Test = mongoose.model("Test", new mongoose.Schema({ name: String }));
app.post("/test-mongo", async (req, res) => {
  try {
    const doc = new Test({ name: req.body.name || "Sample" });
    await doc.save();
    res.json({ success: true, doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

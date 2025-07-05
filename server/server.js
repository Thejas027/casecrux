const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// CORS configuration for production
app.use(cors({
  origin: [
    'https://casecrux.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check route
app.get("/", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "CaseCrux Backend API Running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "healthy",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB with better error handling
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => {
      console.error("MongoDB connection error:", err);
      // Don't crash the server if MongoDB fails
    });
} else {
  console.warn("MONGO_URI not found in environment variables");
}

// Hello route
app.get("/hello", (req, res) => {
  res.json({ message: "Hello from backend!" });
});

// Safely import and use routes with error handling
// Safely import and use routes with error handling
try {
  // Import and use the summarize routes (old features)
  const summarizeRoutes = require("./routes/summarizeRoutes");
  app.use("/api", summarizeRoutes);
} catch (err) {
  console.error("Error loading summarizeRoutes:", err.message);
}

try {
  // Import and use the cloudinaryUpload route (category-based upload)
  const cloudinaryUpload = require("./routes/cloudinaryUpload");
  app.use("/api", cloudinaryUpload);
} catch (err) {
  console.error("Error loading cloudinaryUpload:", err.message);
}

try {
  // Import and use the cloudinaryListFilesByCategory route (list PDFs by category)
  const cloudinaryListFilesByCategory = require("./routes/cloudinaryListFilesByCategory");
  app.use("/api", cloudinaryListFilesByCategory);
} catch (err) {
  console.error("Error loading cloudinaryListFilesByCategory:", err.message);
}

try {
  // Import and use the listUploadedPdfsByCategory route (list uploaded PDFs by category from MongoDB)
  const listUploadedPdfsByCategory = require("./routes/listUploadedPdfsByCategory");
  app.use("/api", listUploadedPdfsByCategory);
} catch (err) {
  console.error("Error loading listUploadedPdfsByCategory:", err.message);
}

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

try {
  // Register the ML proxy route
  const mlProxy = require("./routes/mlProxy");
  app.use("/api", mlProxy);
} catch (err) {
  console.error("Error loading mlProxy:", err.message);
}

try {
  // Register the translate-summary API route
  const translateSummary = require("./routes/translateSummary");
  app.use("/api/translate", translateSummary);
} catch (err) {
  console.error("Error loading translateSummary:", err.message);
}

try {
  // Register the batch summary history API route
  const batchSummaryHistory = require("./routes/batchSummaryHistory");
  app.use("/api", batchSummaryHistory);
} catch (err) {
  console.error("Error loading batchSummaryHistory:", err.message);
}

// Optional routes that may not exist in all deployments
// Optional routes that may not exist in all deployments
try {
  const allCategories = require("./routes/allCategories");
  app.use("/api", allCategories);
} catch (err) {
  console.warn("allCategories route not found, skipping");
}

try {
  const categoryRoutes = require("./routes/categoryRoutes");
  app.use("/api", categoryRoutes);
} catch (err) {
  console.warn("categoryRoutes not found, skipping");
}

try {
  const chatbotRoutes = require("./routes/chatbot");
  app.use("/api/chat", chatbotRoutes);
} catch (err) {
  console.warn("chatbot routes not found, skipping");
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

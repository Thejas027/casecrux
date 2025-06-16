const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const config = require("./config");
const summaryRoutes = require("./routes/summaryRoutes");
const errorHandler = require("./middleware/errorHandler");

// Initialize express app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parses incoming requests with JSON payloads

// API Routes
app.use("/api/summaries", summaryRoutes);

// Root route
app.get("/", (req, res) => res.send("CaseCrux API Running"));

// Centralized Error Handling
app.use(errorHandler);

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});

// index.js
import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";

import symptomRoutes from "./src/routes/symptoms.js";
import alertRoutes from "./src/routes/alerts.js";
import { initDatabase } from "./src/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & parsing middleware
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "Multilingual Healthcare Assistant API",
    version: "1.1.0",
    time: new Date().toISOString(),
  });
});

// Routes
app.use("/api/symptom-check", symptomRoutes); // POST /api/symptom-check
app.use("/api/awareness-alert", alertRoutes);  // POST /api/awareness-alert

// Root info
app.get("/", (_req, res) => {
  res.json({
    message: "🌍 Multilingual Healthcare Assistant API",
    version: "1.1.0",
    endpoints: {
      "POST /api/symptom-check": "Analyze symptoms and provide advice",
      "POST /api/awareness-alert": "Generate multilingual awareness alerts",
      "GET /health": "Health check endpoint",
    },
  });
});

// Start server after DB init
const start = async () => {
  try {
    await initDatabase();
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

start();

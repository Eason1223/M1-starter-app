import dotenv from 'dotenv';
import express from 'express';
import mongoose from "mongoose";

import { connectDB } from './database';
import { errorHandler, notFoundHandler } from './errorHandler.middleware';
import router from './routes';
import path from 'path';

dotenv.config();

const app = express();

app.use(express.json());

// Health check (optional but recommended)
app.get("/health", (_req, res) => res.send("ok"));
app.use('/api', router);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('*', notFoundHandler);
app.use(errorHandler);

// --- Mongo connection + server bootstrap ---
const mongoUri = process.env.MONGODB_URI ?? "mongodb://localhost:27017/CPEN321";

// Log the URI you're using (mask creds if present)
console.log("MONGODB_URI:", mongoUri.replace(/\/\/[^@]+@/, "//***:***@"));

// Log host/db when actually connected
mongoose.connection.on("connected", () => {
  console.log("Mongo host/db:", mongoose.connection.host, mongoose.connection.name);
});

// Optional: log disconnects/errors
mongoose.connection.on("error", (err) => {
  console.error("Mongo error:", err);
});
mongoose.connection.on("disconnected", () => {
  console.warn("Mongo disconnected");
});

(async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected successfully");

    const PORT = parseInt(process.env.PORT ?? "3000", 10);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Listening on ${PORT}`);
    });
  } catch (err) {
    console.error("Mongo connect error:", err);
    process.exit(1);
  }
})();

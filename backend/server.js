import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import messageRoutes from "./routes/message.routes.js";
import { ensureUploadsDir } from "./utils/uploads.js";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://professional-networking-platform-orcin.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.options(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());

app.use(postRoutes);
app.use(userRoutes);
app.use(notificationRoutes);
app.use(messageRoutes);

app.use(express.static("uploads"));

app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ message: "File is too large" });
  }

  if (err.message === "Unsupported file type") {
    return res.status(400).json({ message: err.message });
  }

  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const start = async () => {
  try {
    ensureUploadsDir();

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

    app.listen(9090, () => {
      console.log("🚀 Server running on port 9090");
    });
  } catch (err) {
    console.error("MongoDB Connection Error:");
    console.error(err);
  }
};

start();
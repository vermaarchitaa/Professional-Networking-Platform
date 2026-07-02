import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import postRoutes from "./routes/posts.routes.js";
import userRoutes from "./routes/user.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json());

app.use(postRoutes);
app.use(userRoutes);
app.use(notificationRoutes);

app.use(express.static("uploads"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const start = async () => {
  try {
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
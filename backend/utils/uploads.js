import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";

export const UPLOADS_DIR = "uploads";

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

const VIDEO_TYPES = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const PROFILE_TYPES = IMAGE_TYPES;
const POST_MEDIA_TYPES = { ...IMAGE_TYPES, ...VIDEO_TYPES };

export const ensureUploadsDir = () => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
};

const safeStoredName = (mimetype, allowedTypes) => {
  const ext = allowedTypes[mimetype];
  if (!ext) return null;
  return crypto.randomBytes(32).toString("hex") + ext;
};

const createUploader = (allowedTypes, maxBytes) => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        ensureUploadsDir();
        cb(null, UPLOADS_DIR);
      } catch (error) {
        cb(error);
      }
    },
    filename: (req, file, cb) => {
      const name = safeStoredName(file.mimetype, allowedTypes);
      if (!name) {
        cb(new Error("Unsupported file type"));
        return;
      }
      cb(null, name);
    },
  });

  return multer({
    storage,
    limits: { fileSize: maxBytes },
    fileFilter: (req, file, cb) => {
      if (!allowedTypes[file.mimetype]) {
        cb(new Error("Unsupported file type"));
        return;
      }
      cb(null, true);
    },
  });
};

export const profilePictureUpload = createUploader(PROFILE_TYPES, 2 * 1024 * 1024);
export const postMediaUpload = createUploader(POST_MEDIA_TYPES, 10 * 1024 * 1024);

export const isPdfEmbeddableImage = (filename) => {
  const ext = path.extname(filename || "").toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" || ext === ".png";
};

import fs from "fs";
import path from "path";
import crypto from "crypto";
import multer from "multer";

export const UPLOADS_DIR = "uploads";

const IMAGE_TYPES = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

const VIDEO_TYPES = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

const DOCUMENT_TYPES = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

export const MESSAGE_MEDIA_TYPES = { ...IMAGE_TYPES, ...VIDEO_TYPES };
export const MESSAGE_DOCUMENT_TYPES = {
  ...DOCUMENT_TYPES,
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
};
export const MESSAGE_ATTACHMENT_TYPES = { ...MESSAGE_MEDIA_TYPES, ...MESSAGE_DOCUMENT_TYPES };
const MESSAGE_EXT_ALIASES = { ".jpeg": ".jpg" };

const PROFILE_TYPES = IMAGE_TYPES;
const POST_MEDIA_TYPES = { ...IMAGE_TYPES, ...VIDEO_TYPES };
const EDUCATION_MEDIA_TYPES = { ...IMAGE_TYPES, ...DOCUMENT_TYPES };

export const ensureUploadsDir = () => {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
};

const safeStoredName = (mimetype, allowedTypes) => {
  const ext = allowedTypes[mimetype];
  if (!ext) return null;
  return crypto.randomBytes(32).toString("hex") + ext;
};

const createUploader = (allowedTypes, maxBytes, remapOctetStream = false) => {
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
      if (remapOctetStream && file.mimetype === "application/octet-stream") {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const mapped = Object.entries(allowedTypes).find(([, allowed]) => allowed === ext || allowed === MESSAGE_EXT_ALIASES[ext]);
        if (mapped) file.mimetype = mapped[0];
      }
      if (!allowedTypes[file.mimetype]) {
        cb(new Error("Unsupported file type"));
        return;
      }
      cb(null, true);
    },
  });
};

export const profilePictureUpload = createUploader(PROFILE_TYPES, 2 * 1024 * 1024);
export const coverPhotoUpload = createUploader(IMAGE_TYPES, 5 * 1024 * 1024);
export const postMediaUpload = createUploader(POST_MEDIA_TYPES, 10 * 1024 * 1024);
export const commentImageUpload = createUploader(IMAGE_TYPES, 5 * 1024 * 1024);
export const educationMediaUpload = createUploader(EDUCATION_MEDIA_TYPES, 10 * 1024 * 1024);
export const messageAttachmentUpload = createUploader(MESSAGE_ATTACHMENT_TYPES, 10 * 1024 * 1024, true);

export const isMessageMediaType = (mimetype) => Boolean(MESSAGE_MEDIA_TYPES[mimetype]);
export const isMessageDocumentType = (mimetype) => Boolean(MESSAGE_DOCUMENT_TYPES[mimetype]);

export const allowedMessageExtension = (filename) => {
  const ext = path.extname(filename || "").toLowerCase();
  const normalized = MESSAGE_EXT_ALIASES[ext] || ext;
  return Object.values(MESSAGE_ATTACHMENT_TYPES).includes(normalized);
};

export const isPdfEmbeddableImage = (filename) => {
  const ext = path.extname(filename || "").toLowerCase();
  return ext === ".jpg" || ext === ".jpeg" || ext === ".png";
};

export const removeUploadedFile = (filename) => {
  if (!filename || typeof filename !== "string") return;

  const basename = path.basename(filename);
  if (basename !== filename) return;
  if (!/^[a-f0-9]{64}\.(jpg|jpeg|png|gif|webp|mp4|webm|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(basename)) return;

  const uploadsRoot = path.resolve(UPLOADS_DIR);
  const target = path.resolve(UPLOADS_DIR, basename);
  if (!target.startsWith(uploadsRoot + path.sep)) return;

  fs.unlink(target, () => {});
};

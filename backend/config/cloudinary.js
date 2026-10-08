import { v2 as cloudinary } from "cloudinary";

const PROFILE_FOLDER = "proconnect/profile";
const COVER_FOLDER = "proconnect/covers";
const POST_FOLDER = "proconnect/posts";
const COMMENT_FOLDER = "proconnect/comments";
const EDUCATION_FOLDER = "proconnect/education";
const EXPERIENCE_FOLDER = "proconnect/experience";

const toResourceType = (resourceType) => {
  if (resourceType === "video") return "video";
  if (resourceType === "raw") return "raw";
  return "image";
};

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

const getCloudinary = () => {
  if (!isConfigured()) {
    throw new Error("Cloudinary is not configured");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return cloudinary;
};

export const isCloudinaryPublicId = (value) =>
  typeof value === "string" && value.startsWith("proconnect/");

export const uploadImageBuffer = (buffer, folder, resourceType = "image") => {
  if (!buffer?.length) {
    return Promise.reject(new Error("No file uploaded"));
  }

  const type = toResourceType(resourceType);
  const cloud = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloud.uploader.upload_stream(
      {
        folder,
        resource_type: type,
        overwrite: false,
      },
      (error, result) => {
        if (error || !result?.secure_url || !result?.public_id) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: type,
        });
      }
    );

    stream.end(buffer);
  });
};

export const uploadProfileImage = (buffer) => uploadImageBuffer(buffer, PROFILE_FOLDER);
export const uploadCoverImage = (buffer) => uploadImageBuffer(buffer, COVER_FOLDER);

export const uploadPostMedia = (buffer, mimetype) => {
  const resourceType = String(mimetype || "").startsWith("video/") ? "video" : "image";
  return uploadImageBuffer(buffer, POST_FOLDER, resourceType);
};

export const uploadCommentImage = (buffer) => uploadImageBuffer(buffer, COMMENT_FOLDER);

export const uploadEducationRecordMedia = (buffer, mimetype, kind = "education") => {
  const folder = kind === "experience" ? EXPERIENCE_FOLDER : EDUCATION_FOLDER;
  const mime = String(mimetype || "").toLowerCase();
  const resourceType = mime.startsWith("image/") ? "image" : "raw";
  return uploadImageBuffer(buffer, folder, resourceType);
};

export const destroyCloudinaryAsset = async (publicId, resourceType = "image") => {
  if (!isCloudinaryPublicId(publicId)) return;

  try {
    const cloud = getCloudinary();
    await cloud.uploader.destroy(publicId, {
      resource_type: toResourceType(resourceType),
    });
  } catch {
    // Cleanup must not fail the user-facing request.
  }
};

export const destroyCloudinaryImage = (publicId) => destroyCloudinaryAsset(publicId, "image");

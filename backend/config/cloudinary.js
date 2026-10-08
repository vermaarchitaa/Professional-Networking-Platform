import { v2 as cloudinary } from "cloudinary";

const PROFILE_FOLDER = "proconnect/profile";
const COVER_FOLDER = "proconnect/covers";

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

export const uploadImageBuffer = (buffer, folder) => {
  if (!buffer?.length) {
    return Promise.reject(new Error("No file uploaded"));
  }

  const cloud = getCloudinary();

  return new Promise((resolve, reject) => {
    const stream = cloud.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
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
        });
      }
    );

    stream.end(buffer);
  });
};

export const uploadProfileImage = (buffer) => uploadImageBuffer(buffer, PROFILE_FOLDER);
export const uploadCoverImage = (buffer) => uploadImageBuffer(buffer, COVER_FOLDER);

export const destroyCloudinaryImage = async (publicId) => {
  if (!isCloudinaryPublicId(publicId)) return;

  try {
    const cloud = getCloudinary();
    await cloud.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // Cleanup must not fail the user-facing request.
  }
};

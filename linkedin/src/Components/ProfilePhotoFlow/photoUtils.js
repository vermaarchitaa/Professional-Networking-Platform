import {
  COVER_FILTERS,
  COVER_TYPES,
  DEFAULT_EDIT_STATE,
  drawCoverImage,
  getCoverBaseScale,
  loadImageFromBlob,
  revokeImageUrl,
} from "@/Components/CoverPhotoFlow/coverUtils";

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp";
export const PHOTO_MAX_BYTES = 2 * 1024 * 1024;
export const PHOTO_OUTPUT_SIZE = 512;
export const PHOTO_FILTERS = COVER_FILTERS;
export { DEFAULT_EDIT_STATE, loadImageFromBlob, revokeImageUrl };

export function hasUploadedProfilePicture(user) {
  const picture = user?.profilePicture;
  return Boolean(picture) && picture !== "default.jpg";
}

export function validateProfilePhotoFile(file) {
  if (!file) return "No file selected";
  const namedType = /\.(jpe?g|png|gif|webp)$/i.test(file.name || "");
  if (!COVER_TYPES.has(file.type) && !namedType) {
    return "Unsupported file type. Use JPEG, PNG, GIF, or WebP.";
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return "File is too large. Maximum size is 2MB.";
  }
  return "";
}

export function clampPhotoEdit(image, edit, width = PHOTO_OUTPUT_SIZE, height = PHOTO_OUTPUT_SIZE) {
  if (!image) return edit;
  const zoom = Math.min(3, Math.max(1, edit.zoom || 1));
  const baseScale = getCoverBaseScale(image, width, height, edit.rotation || 0);
  const scale = baseScale * zoom;
  const maxPanX = Math.max(0, (image.naturalWidth * scale - width) / (2 * width));
  const maxPanY = Math.max(0, (image.naturalHeight * scale - height) / (2 * height));
  return {
    ...edit,
    zoom,
    panX: Math.min(maxPanX, Math.max(-maxPanX, edit.panX || 0)),
    panY: Math.min(maxPanY, Math.max(-maxPanY, edit.panY || 0)),
  };
}

export function exportProfileBlob(image, editState) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = PHOTO_OUTPUT_SIZE;
    canvas.height = PHOTO_OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not process image"));
      return;
    }
    const edit = clampPhotoEdit(image, editState);
    drawCoverImage(ctx, image, {
      width: PHOTO_OUTPUT_SIZE,
      height: PHOTO_OUTPUT_SIZE,
      ...edit,
    });
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not process image"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}

export function captureVideoFrame(video) {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("Could not capture photo"));
  ctx.drawImage(video, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not capture photo"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export function stopMediaStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

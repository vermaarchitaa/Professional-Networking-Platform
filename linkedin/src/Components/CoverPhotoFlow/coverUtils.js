export const COVER_RATIO = 4;
export const COVER_OUTPUT_WIDTH = 1584;
export const COVER_OUTPUT_HEIGHT = 396;
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp";
export const COVER_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]);

export const COVER_FILTERS = [
  { id: "original", label: "Original", extra: "" },
  { id: "studio", label: "Studio", extra: "hue-rotate(-10deg) contrast(1.08) saturate(0.95)" },
  { id: "spotlight", label: "Spotlight", extra: "brightness(1.12) contrast(1.1) saturate(0.88)" },
  { id: "prime", label: "Prime", extra: "sepia(0.22) contrast(1.06) saturate(1.05)" },
  { id: "classic", label: "Classic", extra: "grayscale(0.4) contrast(1.08) brightness(1.04)" },
  { id: "edge", label: "Edge", extra: "contrast(1.35) saturate(0.8)" },
  { id: "luminate", label: "Luminate", extra: "brightness(1.18) saturate(1.22) contrast(1.04)" },
];

export const BUILTIN_COVERS = [
  { id: "harbor", name: "Harbor", stops: ["#0f2c4c", "#2e6b9e", "#8ec3e6"] },
  { id: "ember", name: "Ember", stops: ["#3a1c12", "#b4532a", "#f0c27b"] },
  { id: "forest", name: "Forest", stops: ["#0d2818", "#2d6a4f", "#95d5b2"] },
  { id: "dusk", name: "Dusk", stops: ["#1a1028", "#5c3d8f", "#c9a7eb"] },
  { id: "slate", name: "Slate", stops: ["#1c1f24", "#4b5563", "#cbd5e1"] },
  { id: "coral", name: "Coral", stops: ["#4a1a2c", "#d44d6e", "#ffd6a5"] },
];

export const DEFAULT_EDIT_STATE = {
  panX: 0,
  panY: 0,
  zoom: 1,
  rotation: 0,
  flipH: false,
  flipV: false,
  filterId: "original",
  brightness: 100,
  contrast: 100,
  saturation: 100,
  vignette: 0,
};

export function validateCoverFile(file) {
  if (!file) return "No file selected";
  const namedType = /\.(jpe?g|png|gif|webp)$/i.test(file.name || "");
  if (!COVER_TYPES.has(file.type) && !namedType) {
    return "Unsupported file type. Use JPEG, PNG, GIF, or WebP.";
  }
  if (file.size > COVER_MAX_BYTES) {
    return "File is too large. Maximum size is 5MB.";
  }
  return "";
}

export function buildCoverFilter(filterId, brightness, contrast, saturation) {
  const extra = COVER_FILTERS.find((item) => item.id === filterId)?.extra || "";
  return `brightness(${brightness / 100}) contrast(${contrast / 100}) saturate(${saturation / 100}) ${extra}`.trim();
}

export function getCoverBaseScale(image, width, height, rotation) {
  const swapped = Math.abs(rotation) % 180 === 90;
  const sourceWidth = swapped ? image.naturalHeight : image.naturalWidth;
  const sourceHeight = swapped ? image.naturalWidth : image.naturalHeight;
  return Math.max(width / sourceWidth, height / sourceHeight);
}

export function drawCoverImage(ctx, image, {
  width,
  height,
  panX,
  panY,
  zoom,
  rotation,
  flipH,
  flipV,
  filterId,
  brightness,
  contrast,
  saturation,
  vignette,
}) {
  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.fillStyle = "#1d2226";
  ctx.fillRect(0, 0, width, height);
  ctx.filter = buildCoverFilter(filterId, brightness, contrast, saturation);
  ctx.translate(width / 2 + panX * width, height / 2 + panY * height);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  const baseScale = getCoverBaseScale(image, width, height, rotation);
  const scale = baseScale * zoom;
  ctx.drawImage(
    image,
    -(image.naturalWidth * scale) / 2,
    -(image.naturalHeight * scale) / 2,
    image.naturalWidth * scale,
    image.naturalHeight * scale
  );
  ctx.restore();

  if (vignette > 0) {
    const radius = Math.max(width, height) * 0.72;
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.18,
      width / 2,
      height / 2,
      radius
    );
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.78})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
}

export function exportCoverBlob(image, editState) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = COVER_OUTPUT_WIDTH;
    canvas.height = COVER_OUTPUT_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not process image"));
      return;
    }
    drawCoverImage(ctx, image, {
      width: COVER_OUTPUT_WIDTH,
      height: COVER_OUTPUT_HEIGHT,
      ...editState,
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
      0.92
    );
  });
}

function paintGradientCover(ctx, width, height, stops) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  stops.forEach((color, index) => {
    gradient.addColorStop(index / Math.max(stops.length - 1, 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.ellipse(width * 0.78, height * 0.15, width * 0.42, height * 0.9, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function createGradientCoverBlob(stops, width = COVER_OUTPUT_WIDTH, height = COVER_OUTPUT_HEIGHT) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("Could not create cover"));
      return;
    }
    paintGradientCover(ctx, width, height, stops);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not create cover"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.92
    );
  });
}

export function createDefaultCoverBlob() {
  return createGradientCoverBlob(["#8fb4d6", "#3b6fa0", "#1b3f66"]);
}

export function createGradientCoverDataUrl(stops, width = 480, height = 120) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  paintGradientCover(ctx, width, height, stops);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export async function loadImageFromSrc(src) {
  if (!src) {
    const blob = await createDefaultCoverBlob();
    return loadImageFromBlob(blob);
  }

  if (src.startsWith("blob:") || src.startsWith("data:")) {
    return loadImageFromUrl(src);
  }

  try {
    const response = await fetch(src, { mode: "cors", credentials: "omit" });
    if (!response.ok) throw new Error("Failed to load image");
    const blob = await response.blob();
    return loadImageFromBlob(blob);
  } catch {
    return loadImageFromUrl(src);
  }
}

export function loadImageFromBlob(blob) {
  const url = URL.createObjectURL(blob);
  return loadImageFromUrl(url).then((image) => {
    image._objectUrl = url;
    return image;
  });
}

export function loadImageFromUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(src)) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image"));
    image.src = src;
  });
}

export function revokeImageUrl(image) {
  if (image?._objectUrl) {
    URL.revokeObjectURL(image._objectUrl);
  }
}

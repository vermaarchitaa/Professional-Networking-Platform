export const MESSAGE_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const MESSAGE_GIFTS = [
  { id: "gift", emoji: "\u{1F381}" },
  { id: "cake", emoji: "\u{1F382}" },
  { id: "bouquet", emoji: "\u{1F490}" },
  { id: "heart", emoji: "\u2764\uFE0F" },
  { id: "star", emoji: "\u2B50" },
  { id: "party", emoji: "\u{1F389}" },
  { id: "celebrate", emoji: "\u{1F973}" },
  { id: "coffee", emoji: "\u2615" },
  { id: "trophy", emoji: "\u{1F3C6}" },
  { id: "sparkleheart", emoji: "\u{1F496}" },
];

export const TEXT_EMOJIS = [
  "\u{1F600}",
  "\u{1F603}",
  "\u{1F604}",
  "\u{1F60A}",
  "\u{1F60D}",
  "\u{1F618}",
  "\u{1F602}",
  "\u{1F923}",
  "\u{1F605}",
  "\u{1F609}",
  "\u{1F60E}",
  "\u{1F914}",
  "\u{1F644}",
  "\u{1F62E}",
  "\u{1F622}",
  "\u{1F62D}",
  "\u{1F624}",
  "\u{1F621}",
  "\u{1F917}",
  "\u{1F44D}",
  "\u{1F44E}",
  "\u{1F44F}",
  "\u{1F64F}",
  "\u{1F44B}",
  "\u{1F91D}",
  "\u2764\uFE0F",
  "\u{1F49A}",
  "\u{1F49B}",
  "\u{1F49C}",
  "\u{1F525}",
  "\u{1F389}",
  "\u{1F4AF}",
  "\u{1F44C}",
  "\u{1F4AA}",
  "\u{1F37B}",
  "\u{1F370}",
  "\u2600\uFE0F",
  "\u{1F319}",
  "\u2B50",
  "\u{1F3C6}",
];

export const MESSAGE_STICKERS = [
  { id: "thumbs", src: "/stickers/thumbs.svg" },
  { id: "smile", src: "/stickers/smile.svg" },
  { id: "clap", src: "/stickers/clap.svg" },
  { id: "heart", src: "/stickers/heart.svg" },
  { id: "party", src: "/stickers/party.svg" },
  { id: "fire", src: "/stickers/fire.svg" },
  { id: "wow", src: "/stickers/wow.svg" },
  { id: "think", src: "/stickers/think.svg" },
  { id: "wave", src: "/stickers/wave.svg" },
  { id: "star", src: "/stickers/star.svg" },
  { id: "coffee", src: "/stickers/coffee.svg" },
  { id: "cool", src: "/stickers/cool.svg" },
];

const MEDIA_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "mp4", "webm"]);
const DOCUMENT_EXTS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"]);
const MEDIA_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
]);
const DOCUMENT_MIMES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]);

export const MEDIA_ACCEPT = "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm";
export const DOCUMENT_ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/pdf";

const fileExt = (name) => String(name || "").split(".").pop()?.toLowerCase() || "";

export const isAllowedMediaFile = (file) => {
  if (!file) return false;
  const ext = fileExt(file.name);
  return MEDIA_MIMES.has(file.type) || MEDIA_EXTS.has(ext);
};

export const isAllowedDocumentFile = (file) => {
  if (!file) return false;
  const ext = fileExt(file.name);
  return DOCUMENT_MIMES.has(file.type) || DOCUMENT_EXTS.has(ext);
};

export const isVideoFile = (file) => {
  const type = String(file?.type || file?.mimeType || file?.mime || "").toLowerCase();
  const ext = fileExt(file?.name || file?.originalName || file?.filename);
  return type.startsWith("video/") || ext === "mp4" || ext === "webm";
};

export const stickerSrc = (stickerId) => {
  const match = MESSAGE_STICKERS.find((item) => item.id === stickerId);
  return match?.src || "";
};

export const giftEmoji = (giftId) => {
  const match = MESSAGE_GIFTS.find((item) => item.id === giftId);
  return match?.emoji || "";
};

export const formatFileSize = (bytes) => {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export const fileTypeLabel = (name, mimeType) => {
  const ext = fileExt(name).toUpperCase();
  if (ext) return ext;
  const mime = String(mimeType || "").split("/")[1] || "";
  return mime.toUpperCase();
};

export const conversationPreview = (lastMessage, t) => {
  if (!lastMessage) return "";
  const type = lastMessage.messageType || "text";
  const text = String(lastMessage.text || "").trim();
  if (type === "text" || text) return text;
  if (type === "media") {
    return lastMessage.attachment?.kind === "video" ? t("videoMessage") : t("photoMessage");
  }
  if (type === "document") {
    return lastMessage.attachment?.originalName || t("documentMessage");
  }
  if (type === "gif") return t("gif");
  if (type === "profile") return t("sharedProfile");
  if (type === "gift") return lastMessage.attachment?.giftEmoji || t("giftMessage");
  if (type === "sticker") return t("stickerMessage");
  return text;
};

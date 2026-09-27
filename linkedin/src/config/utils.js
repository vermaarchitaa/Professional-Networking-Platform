export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getMediaUrl = (filename) => {
  if (!filename || filename === "default.jpg") return "/images/default-avatar.png";
  return `http://localhost:9090/${filename}`;
};

export const getPostMediaItems = (post) => {
  if (Array.isArray(post?.mediaItems) && post.mediaItems.length > 0) {
    return post.mediaItems;
  }

  if (post?.media && typeof post.media === "string") {
    return [
      {
        filename: post.media,
        fileType: post.fileType || "",
      },
    ];
  }

  return [];
};

export const isImageMedia = (item) => {
  const IMAGE_TYPES = new Set(["jpeg", "jpg", "png", "gif", "webp"]);

  if (!item?.filename) return false;

  const type = String(item.fileType || "").toLowerCase();
  const ext = String(item.filename).split(".").pop().toLowerCase();

  return IMAGE_TYPES.has(type) || IMAGE_TYPES.has(ext);
};

export const isVideoMedia = (item) => {
  const VIDEO_TYPES = new Set(["mp4", "webm"]);

  if (!item?.filename) return false;

  const type = String(item.fileType || "").toLowerCase();
  const ext = String(item.filename).split(".").pop().toLowerCase();

  return VIDEO_TYPES.has(type) || VIDEO_TYPES.has(ext);
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

export const getMediaUrl = (filename) => {
  if (!filename || filename === "default.jpg") return "/images/default-avatar.png";
  return `http://localhost:9090/${filename}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

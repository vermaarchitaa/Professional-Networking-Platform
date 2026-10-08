import React from "react";
import { getMediaUrl, isDefaultProfilePicture } from "@/config/utils";
import styles from "./styles.module.css";

export default function Avatar({ user, size = 48 }) {
  const name = user?.name || user?.username || "?";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasPhoto = !isDefaultProfilePicture(user?.profilePicture);
  const src = hasPhoto ? getMediaUrl(user?.profilePicture) : "";

  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={styles.image}
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <span className={styles.initials} style={{ display: src ? "none" : "flex" }}>
        {initials}
      </span>
    </div>
  );
}

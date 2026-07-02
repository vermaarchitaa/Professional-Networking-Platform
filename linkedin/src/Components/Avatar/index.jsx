import React from "react";
import { getMediaUrl } from "@/config/utils";
import styles from "./styles.module.css";

export default function Avatar({ user, size = 48 }) {
  const name = user?.name || user?.username || "?";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const src = getMediaUrl(user?.profilePicture);

  return (
    <div className={styles.avatar} style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {src && user?.profilePicture !== "default.jpg" ? (
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
      <span className={styles.initials} style={{ display: user?.profilePicture && user.profilePicture !== "default.jpg" ? "none" : "flex" }}>
        {initials}
      </span>
    </div>
  );
}

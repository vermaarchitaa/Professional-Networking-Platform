import React from "react";
import Avatar from "@/Components/Avatar";
import { getPublicProfilePath } from "@/config/utils";
import styles from "./styles.module.css";

export default function ProfileShareCard({ profile, t, onOpen }) {
  if (!profile) return null;
  const path = getPublicProfilePath(profile.username);

  const open = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (path) onOpen?.(path);
  };

  return (
    <article className={styles.card}>
      <button type="button" className={styles.main} onClick={open} disabled={!path}>
        <Avatar user={profile} size={52} />
        <div className={styles.meta}>
          {profile.name ? <p className={styles.name}>{profile.name}</p> : null}
          {profile.headline ? <p className={styles.headline}>{profile.headline}</p> : null}
          {profile.location ? <p className={styles.location}>{profile.location}</p> : null}
          <span className={styles.view}>{t("viewProfile")}</span>
        </div>
      </button>
    </article>
  );
}

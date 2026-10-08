import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Avatar from "@/Components/Avatar";
import { getMediaRef, getMediaUrl, getPublicProfilePath } from "@/config/utils";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function SuggestionCard({ user, profile, onConnect, onDismiss, isPending, isConnected }) {
  const router = useRouter();
  const { t } = useI18n();
  const userData = user?.userId || user;
  const userId = userData?._id;
  const headline = String(profile?.currentPost || "").trim();
  const coverSrc = getMediaRef(userData?.coverPicture) ? getMediaUrl(userData.coverPicture) : "";
  const [coverFailed, setCoverFailed] = useState(false);
  const profilePath = getPublicProfilePath(userData?.username);

  useEffect(() => {
    setCoverFailed(false);
  }, [coverSrc]);

  const openProfile = () => {
    if (profilePath) router.push(profilePath);
  };

  return (
    <article className={styles.card}>
      <button
        type="button"
        className={styles.dismiss}
        onClick={(event) => {
          event.stopPropagation();
          if (userId) onDismiss?.(userId);
        }}
        aria-label={t("dismissSuggestion")}
      >
        <span aria-hidden="true">×</span>
      </button>

      <button
        type="button"
        className={styles.profileArea}
        onClick={openProfile}
        disabled={!profilePath}
      >
        <div className={styles.cover}>
          {coverSrc && !coverFailed ? (
            <img
              src={coverSrc}
              alt=""
              className={styles.coverImage}
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <div className={styles.coverFallback} />
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.photoWrap}>
            <Avatar user={userData} size={72} />
          </div>
          {userData?.name ? <p className={styles.name}>{userData.name}</p> : null}
          {headline ? <p className={styles.headline}>{headline}</p> : <p className={styles.headlineSpacer} />}
        </div>
      </button>

      {onConnect && userId ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.connectBtn}
            onClick={(event) => {
              event.stopPropagation();
              if (!isPending && !isConnected) onConnect(userId);
            }}
            disabled={isPending || isConnected}
          >
            {isConnected ? t("connected") : isPending ? t("pending") : t("connect")}
          </button>
        </div>
      ) : null}
    </article>
  );
}

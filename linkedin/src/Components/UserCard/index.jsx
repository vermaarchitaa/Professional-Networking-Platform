import React from "react";
import Avatar from "@/Components/Avatar";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function UserCard({ user, profile, onConnect, isPending, isConnected }) {
  const { t } = useI18n();
  const userData = user?.userId || user;
  const userId = userData?._id;

  return (
    <div className={styles.card}>
      <Avatar user={userData} size={56} />
      <div className={styles.info}>
        <p className={styles.name}>{userData?.name}</p>
        <p className={styles.username}>@{userData?.username}</p>
        {profile?.bio && <p className={styles.bio}>{profile.bio}</p>}
        {profile?.currentPost && <p className={styles.position}>{profile.currentPost}</p>}
      </div>
      {onConnect && userId && (
        <button
          className={styles.connectBtn}
          onClick={() => onConnect(userId)}
          disabled={isPending || isConnected}
        >
          {isConnected ? t("connected") : isPending ? t("pending") : t("connect")}
        </button>
      )}
    </div>
  );
}

import React from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import Avatar from "@/Components/Avatar";
import styles from "./styles.module.css";

export default function ProfileSidebar() {
  const router = useRouter();
  const { profile } = useSelector((state) => state.profile);
  const user = profile?.userId;

  if (!profile) {
    return (
      <div className={styles.card}>
        <div className={styles.skeleton}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.banner} />
      <div className={styles.content}>
        <Avatar user={user} size={72} />
        <h3 className={styles.name}>{user?.name}</h3>
        <p className={styles.username}>@{user?.username}</p>
        {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
        {profile.currentPost && (
          <p className={styles.position}>{profile.currentPost}</p>
        )}
        <button className={styles.viewBtn} onClick={() => router.push("/profile")}>
          View Profile
        </button>
      </div>
    </div>
  );
}

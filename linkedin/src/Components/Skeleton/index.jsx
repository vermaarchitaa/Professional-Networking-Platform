import React from "react";
import styles from "./styles.module.css";

export function SkeletonLine({ width = "100%", height = 14 }) {
  return <div className={styles.line} style={{ width, height }} />;
}

export function PostSkeleton() {
  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        <div className={styles.circle} />
        <div className={styles.postHeaderText}>
          <SkeletonLine width="40%" height={16} />
          <SkeletonLine width="25%" height={12} />
        </div>
      </div>
      <SkeletonLine width="95%" />
      <SkeletonLine width="80%" />
      <SkeletonLine width="60%" />
      <div className={styles.postActions}>
        <SkeletonLine width={60} height={28} />
        <SkeletonLine width={80} height={28} />
      </div>
    </div>
  );
}

export function ProfileSidebarSkeleton() {
  return (
    <div className={styles.profileCard}>
      <div className={styles.profileBanner} />
      <div className={styles.profileContent}>
        <div className={styles.circleLarge} />
        <SkeletonLine width="60%" height={18} />
        <SkeletonLine width="40%" height={14} />
        <SkeletonLine width="90%" height={12} />
        <SkeletonLine width="100%" height={36} />
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <div className={styles.userCard}>
      <div className={styles.circle} />
      <div className={styles.userCardText}>
        <SkeletonLine width="50%" height={16} />
        <SkeletonLine width="35%" height={12} />
      </div>
      <SkeletonLine width={80} height={36} />
    </div>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className={styles.profileForm}>
      <SkeletonLine width="30%" height={24} />
      <SkeletonLine width="100%" height={44} />
      <SkeletonLine width="100%" height={44} />
      <SkeletonLine width="100%" height={100} />
      <SkeletonLine width="40%" height={40} />
    </div>
  );
}

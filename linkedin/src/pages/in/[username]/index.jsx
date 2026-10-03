import React from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/layout/DashboardLayout";
import ProfilePage from "@/pages/profile";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import styles from "../../profile/style.module.css";

export default function PublicProfilePage() {
  const router = useRouter();
  const username = typeof router.query.username === "string" ? router.query.username : "";

  if (!router.isReady) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <ProfileFormSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return <ProfilePage publicUsername={username} />;
}

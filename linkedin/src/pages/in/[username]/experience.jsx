import React from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/layout/DashboardLayout";
import ExperienceDetailsPage from "@/pages/profile/experience";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import styles from "../../profile/education/style.module.css";

export default function PublicExperienceDetailsPage() {
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

  return <ExperienceDetailsPage publicUsername={username} />;
}

import React from "react";
import { useRouter } from "next/router";
import DashboardLayout from "@/layout/DashboardLayout";
import LanguagesDetailsPage from "@/pages/profile/languages";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import styles from "../../profile/education/style.module.css";

export default function PublicLanguagesDetailsPage() {
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

  return <LanguagesDetailsPage publicUsername={username} />;
}

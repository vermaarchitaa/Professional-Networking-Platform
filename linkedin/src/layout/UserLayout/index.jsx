import NavbarComponent from "@/Components/Navbar";
import React from "react";
import { useRouter } from "next/router";
import styles from "@/layout/DashboardLayout/styles.module.css";

function UserLayout({ children }) {
  const router = useRouter();
  const isLanding = router.pathname === "/";

  return (
    <div className={`${styles.wrapper} ${isLanding ? styles.landingShell : ""}`}>
      <NavbarComponent />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default UserLayout;

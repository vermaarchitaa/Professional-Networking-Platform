import NavbarComponent from "@/Components/Navbar";
import React from "react";
import styles from "@/layout/DashboardLayout/styles.module.css";

function UserLayout({ children }) {
  return (
    <div className={styles.wrapper}>
      <NavbarComponent />
      <div className={styles.content}>{children}</div>
    </div>
  );
}

export default UserLayout;

import NavbarComponent from "@/Components/Navbar";
import React from "react";
import styles from "./styles.module.css";

function DashboardLayout({ children }) {
  return (
    <div className={styles.wrapper}>
      <NavbarComponent />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export default DashboardLayout;

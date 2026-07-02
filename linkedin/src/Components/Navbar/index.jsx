import React, { useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/config/redux/reducer/authReducer";
import { clearProfile } from "@/config/redux/reducer/profileReducer";
import { clearConnections } from "@/config/redux/reducer/connectionReducer";
import { clearNotifications } from "@/config/redux/reducer/notificationReducer";
import NotificationBell from "@/Components/NotificationBell";
import { getToken } from "@/config/utils";
import { useAuthCheck } from "@/hooks/useAuth";
import styles from "./styles.module.css";

export default function NavbarComponent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loggedIn } = useSelector((state) => state.auth);
  const [menuOpen, setMenuOpen] = useState(false);

  useAuthCheck();

  const isLoggedIn = loggedIn || !!getToken();

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearProfile());
    dispatch(clearConnections());
    dispatch(clearNotifications());
    setMenuOpen(false);
    router.push("/login");
  };

  const navigate = (path) => {
    router.push(path);
    setMenuOpen(false);
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1 className={styles.logo} onClick={() => navigate(isLoggedIn ? "/dashboard" : "/")}>
          Pro Connect
        </h1>

        {isLoggedIn && (
          <div className={styles.bellWrap}>
            <NotificationBell isLoggedIn={isLoggedIn} />
          </div>
        )}

        <button
          className={styles.menuToggle}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className={`${styles.navbarOptionContainer} ${menuOpen ? styles.menuOpen : ""}`}>
          {isLoggedIn ? (
            <>
              <button className={styles.navLink} onClick={() => navigate("/dashboard")}>
                Feed
              </button>
              <button className={styles.navLink} onClick={() => navigate("/connections")}>
                Network
              </button>
              <button className={styles.navLink} onClick={() => navigate("/profile")}>
                Profile
              </button>
              <button className={styles.navLink} onClick={() => navigate("/blog")}>
                Blog
              </button>
              <button className={styles.buttonJoin} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className={styles.navLink} onClick={() => navigate("/blog")}>
                Blog
              </button>
              <div onClick={() => navigate("/login")} className={styles.buttonJoin}>
                <p>Be a part</p>
              </div>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/config/redux/reducer/authReducer";
import { clearProfile } from "@/config/redux/reducer/profileReducer";
import { clearConnections } from "@/config/redux/reducer/connectionReducer";
import { clearNotifications } from "@/config/redux/reducer/notificationReducer";
import { clearMessages } from "@/config/redux/reducer/messageReducer";
import { fetchUserProfile } from "@/config/redux/action/profileAction";
import { fetchMessageUnreadCount } from "@/config/redux/action/messageAction";
import { fetchNewPostCount } from "@/config/redux/action/notificationAction";
import NotificationBell from "@/Components/NotificationBell";
import PeopleSearch from "@/Components/PeopleSearch";
import Avatar from "@/Components/Avatar";
import { getToken } from "@/config/utils";
import { useAuthCheck } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import {
  BriefcaseBusinessIcon,
  ChevronDownIcon,
  HouseIcon,
  MessageCircleIcon,
  NewspaperIcon,
  UsersIcon,
} from "./icons";
import styles from "./styles.module.css";

const JOBS_PATH = "/jobs";
const MESSAGING_PATH = "/messaging";
const JOBS_ENABLED = false;

function isSectionActive(pathname, match) {
  return pathname === match || pathname.startsWith(`${match}/`);
}

export default function NavbarComponent() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useI18n();
  const { loggedIn } = useSelector((state) => state.auth);
  const { profile, isLoading: profileLoading, isError: profileError } = useSelector((state) => state.profile);
  const unreadMessages = useSelector((state) => state.messages.unreadCount);
  const newPostCount = useSelector((state) => state.notifications.newPostCount);
  const [meOpen, setMeOpen] = useState(false);
  const meRef = useRef(null);

  useAuthCheck();

  const isLoggedIn = loggedIn;
  const pathname = router.pathname || "";
  const user = profile?.userId;
  const headline = String(profile?.currentPost || "").trim();

  useEffect(() => {
    if (!isLoggedIn || profile?.userId || profileLoading || profileError || !getToken()) return;
    dispatch(fetchUserProfile());
  }, [dispatch, isLoggedIn, profile, profileLoading, profileError]);

  useEffect(() => {
    if (isLoggedIn && getToken()) {
      dispatch(fetchMessageUnreadCount());
      dispatch(fetchNewPostCount());
    }
  }, [dispatch, isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (meRef.current && !meRef.current.contains(event.target)) {
        setMeOpen(false);
      }
    };
    if (meOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [meOpen]);

  useEffect(() => {
    setMeOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearProfile());
    dispatch(clearConnections());
    dispatch(clearNotifications());
    dispatch(clearMessages());
    setMeOpen(false);
    router.push("/login");
  };

  const navigate = (path) => {
    router.push(path);
    setMeOpen(false);
  };

  const handleJobsClick = () => {
    if (!JOBS_ENABLED) return;
    navigate(JOBS_PATH);
  };

  const handleMessagingClick = () => {
    navigate(MESSAGING_PATH);
  };

  const homeActive = isSectionActive(pathname, "/dashboard");
  const networkActive = isSectionActive(pathname, "/connections");
  const jobsActive = JOBS_ENABLED && isSectionActive(pathname, JOBS_PATH);
  const messagingActive = isSectionActive(pathname, MESSAGING_PATH);
  const blogActive = isSectionActive(pathname, "/blog");
  const meActive = isSectionActive(pathname, "/profile");

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1 className={styles.logo} onClick={() => navigate(isLoggedIn ? "/dashboard" : "/")}>
          Pro Connect
        </h1>

        {isLoggedIn ? <PeopleSearch /> : null}

        {isLoggedIn ? (
          <div className={styles.navbarOptionContainer}>
            <button
              type="button"
              className={`${styles.navItem} ${homeActive ? styles.navItemActive : ""}`}
              onClick={() => navigate("/dashboard")}
            >
              <span className={styles.iconSlot}>
                <HouseIcon />
                {newPostCount > 0 ? (
                  <span className={styles.homeBadge} aria-label={t("homeNewPosts")} />
                ) : null}
              </span>
              <span className={styles.label}>{t("home")}</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${networkActive ? styles.navItemActive : ""}`}
              onClick={() => navigate("/connections")}
            >
              <span className={styles.iconSlot}><UsersIcon /></span>
              <span className={styles.label}>{t("network")}</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${styles.navItemDisabled} ${jobsActive ? styles.navItemActive : ""}`}
              onClick={handleJobsClick}
              aria-disabled="true"
            >
              <span className={styles.iconSlot}><BriefcaseBusinessIcon /></span>
              <span className={styles.label}>{t("jobs")}</span>
            </button>

            <button
              type="button"
              className={`${styles.navItem} ${messagingActive ? styles.navItemActive : ""}`}
              onClick={handleMessagingClick}
            >
              <span className={styles.iconSlot}>
                <MessageCircleIcon />
                {unreadMessages > 0 ? (
                  <span className={styles.messageBadge}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                ) : null}
              </span>
              <span className={styles.label}>{t("messaging")}</span>
            </button>

            <NotificationBell isLoggedIn={isLoggedIn} />

            <button
              type="button"
              className={`${styles.navItem} ${blogActive ? styles.navItemActive : ""}`}
              onClick={() => navigate("/blog")}
            >
              <span className={styles.iconSlot}><NewspaperIcon /></span>
              <span className={styles.label}>{t("blog")}</span>
            </button>

            <div className={styles.meWrap} ref={meRef}>
              <button
                type="button"
                className={`${styles.navItem} ${meActive ? styles.navItemActive : ""}`}
                onClick={() => setMeOpen((open) => !open)}
                aria-expanded={meOpen}
              >
                <span className={styles.iconSlot}>
                  <Avatar key={user?.profilePicture || user?._id || "me"} user={user} size={24} />
                </span>
                <span className={styles.label}>
                  {t("me")}
                  <ChevronDownIcon />
                </span>
              </button>
              {meOpen ? (
                <div
                  className={styles.meMenu}
                  role="menu"
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <div className={styles.meProfile}>
                    <Avatar key={user?.profilePicture || user?._id || "me-menu"} user={user} size={48} />
                    <div className={styles.meProfileText}>
                      {user?.name ? <p className={styles.meName}>{user.name}</p> : null}
                      {headline ? <p className={styles.meHeadline}>{headline}</p> : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.viewProfileBtn}
                    onClick={() => navigate("/profile")}
                  >
                    {t("viewProfile")}
                  </button>
                </div>
              ) : null}
            </div>

            <button type="button" className={styles.logoutItem} onClick={handleLogout}>
              {t("logout")}
            </button>
          </div>
        ) : (
          <div className={styles.navbarOptionContainer}>
            <button type="button" className={styles.navLink} onClick={() => navigate("/blog")}>
              {t("blog")}
            </button>
            <div onClick={() => navigate("/login")} className={styles.buttonJoin}>
              <p>{t("beAPart")}</p>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

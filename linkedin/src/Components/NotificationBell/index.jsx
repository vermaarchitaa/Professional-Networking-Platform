import React, { useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import Avatar from "@/Components/Avatar";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/config/redux/action/notificationAction";
import {
  closeNotificationPanel,
  toggleNotificationPanel,
} from "@/config/redux/reducer/notificationReducer";
import useNotificationPoll, { useFetchNotificationsOnOpen } from "@/hooks/useNotificationPoll";
import { formatDate } from "@/config/utils";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function NotificationBell({ isLoggedIn }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const panelRef = useRef(null);
  const { items, unreadCount, isOpen, isLoading } = useSelector((state) => state.notifications);
  const { t, language } = useI18n();

  useNotificationPoll(isLoggedIn);
  useFetchNotificationsOnOpen(isOpen, isLoggedIn);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        dispatch(closeNotificationPanel());
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, dispatch]);

  const handleToggle = () => {
    dispatch(toggleNotificationPanel());
    if (!isOpen) dispatch(fetchNotifications());
  };

  const handleNotificationClick = (notification) => {
    dispatch(markNotificationRead(notification._id));

    if (notification.type === "connection_request") {
      router.push("/connections");
    } else if (notification.type === "like" || notification.type === "comment") {
      router.push("/dashboard");
    } else if (notification.type === "connection_accept") {
      router.push("/connections");
    }

    dispatch(closeNotificationPanel());
  };

  if (!isLoggedIn) return null;

  return (
    <div className={styles.wrapper} ref={panelRef}>
      <button className={styles.bellBtn} onClick={handleToggle} aria-label={t("notifications")}>
        🔔
        {unreadCount > 0 && (
          <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>{t("notifications")}</h3>
            {unreadCount > 0 && (
              <button onClick={() => dispatch(markAllNotificationsRead())}>{t("markAllRead")}</button>
            )}
          </div>

          <div className={styles.panelBody}>
            {isLoading ? (
              <p className={styles.empty}>{t("loading")}</p>
            ) : items.length === 0 ? (
              <p className={styles.empty}>{t("noNotifications")}</p>
            ) : (
              items.map((n) => (
                <div
                  key={n._id}
                  className={`${styles.item} ${!n.read ? styles.unread : ""}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <Avatar user={n.senderId} size={36} />
                  <div className={styles.itemText}>
                    <p>{n.message}</p>
                    <span>{formatDate(n.createdAt, language)}</span>
                  </div>
                  {!n.read && <span className={styles.dot} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

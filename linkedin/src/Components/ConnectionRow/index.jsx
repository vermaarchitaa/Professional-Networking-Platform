import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import Avatar from "@/Components/Avatar";
import { getPublicProfilePath } from "@/config/utils";
import { toIntlLocale, useI18n } from "@/i18n";
import styles from "./styles.module.css";

function formatConnectedDate(date, language) {
  if (!date) return "";
  return new Date(date).toLocaleDateString(toIntlLocale(language), {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ConnectionRow({
  user,
  headline,
  acceptedAt,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onRemove,
}) {
  const router = useRouter();
  const { t, language } = useI18n();
  const menuRef = useRef(null);
  const profilePath = getPublicProfilePath(user?.username);
  const connectedLabel = acceptedAt
    ? t("connectedOn", { date: formatConnectedDate(acceptedAt, language) })
    : t("connected");

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onCloseMenu?.();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen, onCloseMenu]);

  const openProfile = () => {
    if (!profilePath) return;
    router.push(profilePath);
  };

  return (
    <article className={styles.row}>
      <button type="button" className={styles.profileBtn} onClick={openProfile}>
        <Avatar user={user} size={56} />
        <div className={styles.info}>
          {user?.name ? <p className={styles.name}>{user.name}</p> : null}
          {headline ? <p className={styles.headline}>{headline}</p> : null}
          <p className={styles.date}>{connectedLabel}</p>
        </div>
      </button>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.messageBtn} ${styles.messageBtnActive}`}
          onClick={() => user?._id && router.push(`/messaging?userId=${user._id}`)}
        >
          {t("messageAction")}
        </button>
        <div className={styles.menuWrap} ref={menuRef}>
          <button
            type="button"
            className={styles.moreBtn}
            aria-label={t("more")}
            aria-expanded={menuOpen}
            onClick={onToggleMenu}
          >
            ⋯
          </button>
          {menuOpen ? (
            <div className={styles.menu} role="menu">
              <button type="button" className={styles.menuItem} onClick={onRemove}>
                <span aria-hidden="true">🗑</span>
                {t("removeConnection")}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

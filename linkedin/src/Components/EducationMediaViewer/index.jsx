import React, { useEffect } from "react";
import { getMediaUrl } from "@/config/utils";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function EducationMediaViewer({
  items = [],
  index = 0,
  onClose,
  onIndexChange,
}) {
  const { t } = useI18n();
  const total = items.length;
  const current = items[index];
  const canPrev = index > 0;
  const canNext = index < total - 1;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
        return;
      }
      if (event.key === "ArrowLeft" && canPrev) {
        onIndexChange?.(index - 1);
        return;
      }
      if (event.key === "ArrowRight" && canNext) {
        onIndexChange?.(index + 1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canNext, canPrev, index, onClose, onIndexChange]);

  if (!current) return null;

  const mediaHref = current.type === "link" ? current.url : getMediaUrl(current.url);
  const title = String(current.name || "").trim();
  const description = String(current.description || "").trim();

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="education-media-title"
      >
        <header className={styles.header}>
          <h2 id="education-media-title">{t("media")}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label={t("close")}>
            ×
          </button>
        </header>
        <div className={styles.content}>
          <div className={styles.mediaPane}>
            {current.type === "image" ? (
              <img
                src={mediaHref}
                alt={title || t("educationMedia")}
                className={styles.image}
              />
            ) : (
              <div className={styles.fileCard}>
                <p className={styles.fileName}>{title || (current.type === "document" ? "Document" : "Link")}</p>
                <a href={mediaHref} target="_blank" rel="noreferrer">
                  Open {current.type === "document" ? "document" : "link"}
                </a>
              </div>
            )}
          </div>
          <div className={styles.sidePane}>
            <div className={styles.sideCopy}>
              {title ? <h3 className={styles.title}>{title}</h3> : null}
              {description ? <p className={styles.description}>{description}</p> : null}
            </div>
            <div className={styles.nav}>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => canPrev && onIndexChange?.(index - 1)}
                disabled={!canPrev}
              >
                Previous
              </button>
              <button
                type="button"
                className={styles.navBtn}
                onClick={() => canNext && onIndexChange?.(index + 1)}
                disabled={!canNext}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

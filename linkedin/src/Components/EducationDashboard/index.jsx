import React, { useEffect } from "react";
import { formatEducationDates } from "@/Components/EducationRecordForm";
import { getMediaUrl } from "@/config/utils";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function EducationDashboard({
  isOpen = true,
  asPage = false,
  entries = [],
  ignoreEscape = false,
  onClose,
  onAdd,
  onEdit,
  onOpenMedia,
}) {
  const { t, language } = useI18n();
  useEffect(() => {
    if (asPage || !isOpen || ignoreEscape) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [asPage, isOpen, ignoreEscape, onClose]);

  if (!asPage && !isOpen) return null;

  const content = (
    <>
        <header className={styles.header}>
          <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t("back")}>
            ←
          </button>
          <h2 id="education-dashboard-title">{t("education")}</h2>
          <div className={styles.headerActions}>
            {onAdd ? (
              <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label={t("addEducation")}>
                +
              </button>
            ) : null}
            {asPage ? null : (
              <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t("close")}>
                ×
              </button>
            )}
          </div>
        </header>

        <div className={styles.body}>
          {entries.length === 0 ? (
            <p className={styles.empty}>{t("noEducationYet")}</p>
          ) : (
            entries.map((entry, index) => {
              const skillNames = (entry.skills || []).map((item) => item?.name).filter(Boolean);
              const mediaItems = (entry.media || []).filter((item) => item?.url);
              const schoolLetter = (String(entry.school || "").trim()[0] || "?").toUpperCase();
              const eduKey = entry._id ? String(entry._id) : `idx-${index}`;
              const dates = formatEducationDates(entry, language, t("present"));
              return (
                <article key={entry._id || index} className={styles.row}>
                  <span className={styles.avatar} aria-hidden="true">{schoolLetter}</span>
                  <div className={styles.details}>
                    <h3>{entry.school}</h3>
                    {entry.degree ? <p>{entry.degree}</p> : null}
                    {entry.fieldOfStudy ? <p>{entry.fieldOfStudy}</p> : null}
                    {dates ? <p>{dates}</p> : null}
                    {entry.grade ? <p>{t("gradeLabel")} {entry.grade}</p> : null}
                    {entry.activitiesAndSocieties ? (
                      <p className={styles.copy}>
                        <strong>{t("activitiesLabel")} </strong>
                        {entry.activitiesAndSocieties}
                      </p>
                    ) : null}
                    {entry.description ? <p className={styles.copy}>{entry.description}</p> : null}
                    {skillNames.length > 0 ? (
                      <p className={styles.copy}><strong>{t("skillsLabel")} </strong>{skillNames.join(", ")}</p>
                    ) : null}
                    {mediaItems.length > 0 ? (
                      <div className={styles.mediaGrid}>
                        {mediaItems.map((item, mediaIndex) => (
                          item.type === "image" ? (
                            <button
                              key={`${item.url}-${mediaIndex}`}
                              type="button"
                              className={styles.mediaImageBtn}
                              onClick={() => onOpenMedia?.({ eduKey, mediaIndex })}
                              aria-label={item.name || t("openEducationMedia")}
                            >
                              <img
                                src={getMediaUrl(item.url)}
                                alt={item.name || t("educationMedia")}
                                className={styles.mediaImage}
                              />
                            </button>
                          ) : (
                            <button
                              key={`${item.url}-${mediaIndex}`}
                              type="button"
                              className={styles.mediaLink}
                              onClick={() => onOpenMedia?.({ eduKey, mediaIndex })}
                            >
                              {item.name || (item.type === "document" ? t("document") : item.url)}
                            </button>
                          )
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {onEdit ? (
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => onEdit(entry)}
                      aria-label={t("editNamed", { name: entry.school })}
                    >
                      ✎
                    </button>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
    </>
  );

  if (asPage) {
    return (
      <section className={styles.page} aria-labelledby="education-dashboard-title">
        {content}
      </section>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="education-dashboard-title"
      >
        {content}
      </div>
    </div>
  );
}

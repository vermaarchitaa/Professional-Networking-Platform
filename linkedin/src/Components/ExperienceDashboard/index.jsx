import React, { useEffect } from "react";
import { formatExperienceDates } from "@/Components/ExperienceRecordForm";
import { getMediaUrl } from "@/config/utils";
import { tEnum, useI18n } from "@/i18n";
import styles from "@/Components/EducationDashboard/styles.module.css";

export default function ExperienceDashboard({
  entries = [],
  onClose,
  onAdd,
  onEdit,
  onOpenMedia,
}) {
  const { t, language } = useI18n();
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <section className={styles.page} aria-labelledby="experience-dashboard-title">
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={onClose} aria-label={t("back")}>←</button>
        <h2 id="experience-dashboard-title">{t("experience")}</h2>
        <div className={styles.headerActions}>
          {onAdd ? (
            <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label={t("addExperience")}>+</button>
          ) : null}
        </div>
      </header>
      <div className={styles.body}>
        {entries.length === 0 ? (
          <p className={styles.empty}>{t("noExperienceYet")}</p>
        ) : (
          entries.map((entry, index) => {
            const skillNames = (entry.skills || []).map((item) => item?.name).filter(Boolean);
            const mediaItems = (entry.media || []).filter((item) => item?.url);
            const letter = (String(entry.company || entry.position || "?").trim()[0] || "?").toUpperCase();
            const workKey = entry._id ? String(entry._id) : `idx-${index}`;
            const dates = formatExperienceDates(entry, language, t("present"));
            return (
              <article key={entry._id || index} className={styles.row}>
                <span className={styles.avatar} aria-hidden="true">{letter}</span>
                <div className={styles.details}>
                  <h3>{entry.position || t("experience")}</h3>
                  {entry.company ? <p>{entry.company}</p> : null}
                  {entry.employmentType ? <p>{tEnum(t, entry.employmentType)}</p> : null}
                  {dates ? <p>{dates}</p> : null}
                  {entry.location || entry.locationType ? (
                    <p>{[entry.location, entry.locationType ? tEnum(t, entry.locationType) : ""].filter(Boolean).join(" · ")}</p>
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
                            onClick={() => onOpenMedia?.({ workKey, mediaIndex })}
                            aria-label={item.name || t("openExperienceMedia")}
                          >
                            <img src={getMediaUrl(item.url)} alt={item.name || t("experienceMedia")} className={styles.mediaImage} />
                          </button>
                        ) : (
                          <button
                            key={`${item.url}-${mediaIndex}`}
                            type="button"
                            className={styles.mediaLink}
                            onClick={() => onOpenMedia?.({ workKey, mediaIndex })}
                          >
                            {item.name || (item.type === "document" ? t("document") : item.url)}
                          </button>
                        )
                      ))}
                    </div>
                  ) : null}
                </div>
                {onEdit ? (
                  <button type="button" className={styles.iconBtn} onClick={() => onEdit(entry)} aria-label={t("editNamed", { name: entry.position || entry.company || t("experience") })}>
                    ✎
                  </button>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

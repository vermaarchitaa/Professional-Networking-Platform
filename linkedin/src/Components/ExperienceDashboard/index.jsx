import React, { useEffect } from "react";
import { formatExperienceDates } from "@/Components/ExperienceRecordForm";
import { getMediaUrl } from "@/config/utils";
import styles from "@/Components/EducationDashboard/styles.module.css";

export default function ExperienceDashboard({
  entries = [],
  onClose,
  onAdd,
  onEdit,
  onOpenMedia,
}) {
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
        <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Back">←</button>
        <h2 id="experience-dashboard-title">Experience</h2>
        <div className={styles.headerActions}>
          {onAdd ? (
            <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label="Add experience">+</button>
          ) : null}
        </div>
      </header>
      <div className={styles.body}>
        {entries.length === 0 ? (
          <p className={styles.empty}>No experience added yet.</p>
        ) : (
          entries.map((entry, index) => {
            const skillNames = (entry.skills || []).map((item) => item?.name).filter(Boolean);
            const mediaItems = (entry.media || []).filter((item) => item?.url);
            const letter = (String(entry.company || entry.position || "?").trim()[0] || "?").toUpperCase();
            const workKey = entry._id ? String(entry._id) : `idx-${index}`;
            const dates = formatExperienceDates(entry);
            return (
              <article key={entry._id || index} className={styles.row}>
                <span className={styles.avatar} aria-hidden="true">{letter}</span>
                <div className={styles.details}>
                  <h3>{entry.position || "Experience"}</h3>
                  {entry.company ? <p>{entry.company}</p> : null}
                  {entry.employmentType ? <p>{entry.employmentType}</p> : null}
                  {dates ? <p>{dates}</p> : null}
                  {entry.location || entry.locationType ? (
                    <p>{[entry.location, entry.locationType].filter(Boolean).join(" · ")}</p>
                  ) : null}
                  {entry.description ? <p className={styles.copy}>{entry.description}</p> : null}
                  {skillNames.length > 0 ? (
                    <p className={styles.copy}><strong>Skills: </strong>{skillNames.join(", ")}</p>
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
                            aria-label={item.name || "Open experience media"}
                          >
                            <img src={getMediaUrl(item.url)} alt={item.name || "Experience media"} className={styles.mediaImage} />
                          </button>
                        ) : (
                          <button
                            key={`${item.url}-${mediaIndex}`}
                            type="button"
                            className={styles.mediaLink}
                            onClick={() => onOpenMedia?.({ workKey, mediaIndex })}
                          >
                            {item.name || (item.type === "document" ? "Document" : item.url)}
                          </button>
                        )
                      ))}
                    </div>
                  ) : null}
                </div>
                {onEdit ? (
                  <button type="button" className={styles.iconBtn} onClick={() => onEdit(entry)} aria-label={`Edit ${entry.position || entry.company}`}>
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

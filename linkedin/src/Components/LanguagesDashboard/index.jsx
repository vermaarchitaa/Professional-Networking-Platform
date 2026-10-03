import React, { useEffect } from "react";
import styles from "@/Components/SkillsDashboard/styles.module.css";

export default function LanguagesDashboard({
  entries = [],
  onClose,
  onAdd,
  onEdit,
}) {
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <section className={styles.page} aria-labelledby="languages-dashboard-title">
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={onClose} aria-label="Back">←</button>
        <h2 id="languages-dashboard-title">Languages</h2>
        <div className={styles.headerActions}>
          {onAdd ? (
            <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label="Add language">+</button>
          ) : null}
        </div>
      </header>
      <div className={styles.body}>
        {entries.length === 0 ? (
          <p className={styles.empty}>No languages added yet.</p>
        ) : (
          entries.map((entry, index) => (
            <article key={entry._id || `${entry.language}-${index}`} className={styles.row}>
              <div className={styles.details}>
                <h3>{entry.language}</h3>
                {entry.proficiency ? <p>{entry.proficiency}</p> : null}
              </div>
              {onEdit ? (
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={() => onEdit(entry)}
                  aria-label={`Edit ${entry.language}`}
                >
                  ✎
                </button>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

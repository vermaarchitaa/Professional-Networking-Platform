import React from "react";
import { isFilledLanguage } from "@/Components/LanguageRecordForm";
import styles from "@/Components/SkillsSection/styles.module.css";

export default function LanguagesSection({
  profile,
  isOwner = false,
  onAdd,
  onOpenDetails,
}) {
  const languages = (profile?.languages || []).filter(isFilledLanguage);

  if (languages.length === 0) return null;

  return (
    <section id="languages" className={styles.section}>
      <div className={styles.header}>
        <h2>Languages ({languages.length})</h2>
        {isOwner ? (
          <div className={styles.actions}>
            <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label="Add language">
              +
            </button>
            <button type="button" className={styles.iconBtn} onClick={onOpenDetails} aria-label="Manage languages">
              ✎
            </button>
          </div>
        ) : null}
      </div>
      <ul className={`${styles.list} ${languages.length > 2 ? styles.listWithMore : ""}`}>
        {languages.slice(0, 2).map((entry, index) => (
          <li key={entry._id || `${entry.language}-${index}`} className={styles.item}>
            <p className={styles.name}>{entry.language}</p>
            {entry.proficiency ? <p className={styles.meta}>{entry.proficiency}</p> : null}
          </li>
        ))}
      </ul>
      {languages.length > 2 ? (
        <button type="button" className={styles.showAll} onClick={onOpenDetails}>
          Show all {languages.length} languages →
        </button>
      ) : null}
    </section>
  );
}

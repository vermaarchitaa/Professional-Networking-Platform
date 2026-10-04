import React from "react";
import { isFilledLanguage } from "@/Components/LanguageRecordForm";
import { tEnum, useI18n } from "@/i18n";
import styles from "@/Components/SkillsSection/styles.module.css";

export default function LanguagesSection({
  profile,
  isOwner = false,
  onAdd,
  onOpenDetails,
}) {
  const { t } = useI18n();
  const languages = (profile?.languages || []).filter(isFilledLanguage);

  if (languages.length === 0) return null;

  return (
    <section id="languages" className={styles.section}>
      <div className={styles.header}>
        <h2>{t("languagesCount", { count: languages.length })}</h2>
        {isOwner ? (
          <div className={styles.actions}>
            <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label={t("addLanguage")}>
              +
            </button>
            <button type="button" className={styles.iconBtn} onClick={onOpenDetails} aria-label={t("manageLanguages")}>
              ✎
            </button>
          </div>
        ) : null}
      </div>
      <ul className={`${styles.list} ${languages.length > 2 ? styles.listWithMore : ""}`}>
        {languages.slice(0, 2).map((entry, index) => (
          <li key={entry._id || `${entry.language}-${index}`} className={styles.item}>
            <p className={styles.name}>{entry.language}</p>
            {entry.proficiency ? <p className={styles.meta}>{tEnum(t, entry.proficiency)}</p> : null}
          </li>
        ))}
      </ul>
      {languages.length > 2 ? (
        <button type="button" className={styles.showAll} onClick={onOpenDetails}>
          {t("showAllLanguages", { count: languages.length })}
        </button>
      ) : null}
    </section>
  );
}

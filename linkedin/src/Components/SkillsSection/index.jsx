import React from "react";
import { listProfileSkills, resolveSkillAssociations } from "./skillUtils";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function SkillsSection({
  profile,
  isOwner = false,
  onAdd,
  onOpenDetails,
}) {
  const { t } = useI18n();
  const skills = listProfileSkills(profile);

  if (!isOwner && skills.length === 0) return null;

  return (
    <section id="skills" className={styles.section}>
      {skills.length === 0 ? (
        <>
          <h2>{t("skills")}</h2>
          <p className={styles.intro}>
            {t("skillsIntro")}
          </p>
          <div className={styles.emptyRow}>{t("softSkills")}</div>
          <div className={styles.emptyRowLast}>{t("technicalSkills")}</div>
          {isOwner ? (
            <button type="button" className={styles.addBtn} onClick={onAdd}>
              {t("addSkills")}
            </button>
          ) : null}
        </>
      ) : (
        <>
          <div className={styles.header}>
            <h2>{t("skillsCount", { count: skills.length })}</h2>
            {isOwner ? (
              <div className={styles.actions}>
                <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label={t("addSkill")}>
                  +
                </button>
                <button type="button" className={styles.iconBtn} onClick={onOpenDetails} aria-label={t("manageSkills")}>
                  ✎
                </button>
              </div>
            ) : null}
          </div>
          <ul className={`${styles.list} ${skills.length > 2 ? styles.listWithMore : ""}`}>
            {skills.slice(0, 2).map((skill) => {
              const associations = resolveSkillAssociations(skill, profile);
              return (
                <li key={skill._id || skill.name} className={styles.item}>
                  <p className={styles.name}>{skill.name}</p>
                  {associations.length > 0 ? (
                    <p className={styles.meta}>{associations.map((item) => item.label).join(" · ")}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          {skills.length > 2 ? (
            <button type="button" className={styles.showAll} onClick={onOpenDetails}>
              {t("showAll")}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

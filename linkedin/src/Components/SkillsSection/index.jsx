import React from "react";
import { listProfileSkills, resolveSkillAssociations } from "./skillUtils";
import styles from "./styles.module.css";

export default function SkillsSection({
  profile,
  isOwner = false,
  onAdd,
  onOpenDetails,
}) {
  const skills = listProfileSkills(profile);

  if (!isOwner && skills.length === 0) return null;

  return (
    <section id="skills" className={styles.section}>
      {skills.length === 0 ? (
        <>
          <h2>Skills</h2>
          <p className={styles.intro}>
            Communicate your fit for new opportunities – 50% of hirers use skills data to fill their roles.
          </p>
          <div className={styles.emptyRow}>Soft skills</div>
          <div className={styles.emptyRowLast}>Technical Skills</div>
          {isOwner ? (
            <button type="button" className={styles.addBtn} onClick={onAdd}>
              Add skills
            </button>
          ) : null}
        </>
      ) : (
        <>
          <div className={styles.header}>
            <h2>Skills ({skills.length})</h2>
            {isOwner ? (
              <div className={styles.actions}>
                <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label="Add skill">
                  +
                </button>
                <button type="button" className={styles.iconBtn} onClick={onOpenDetails} aria-label="Manage skills">
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
              Show all →
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

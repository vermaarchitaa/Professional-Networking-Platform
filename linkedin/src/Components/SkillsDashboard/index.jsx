import React, { useState } from "react";
import { listProfileSkills, resolveSkillAssociations } from "@/Components/SkillsSection/skillUtils";
import styles from "./styles.module.css";

export default function SkillsDashboard({
  profile,
  isOwner = false,
  onBack,
  onAdd,
  onEdit,
}) {
  const [tab, setTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const skills = listProfileSkills(profile);
  const visible = tab === "tools" ? skills.filter((item) => item.category === "tools") : skills;

  return (
    <section className={styles.page} aria-labelledby="skills-dashboard-title">
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={onBack} aria-label="Back">
          ←
        </button>
        <h2 id="skills-dashboard-title">Skills</h2>
        <div className={styles.headerActions}>
          <div className={styles.menuWrap}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="More"
            >
              ⋯
            </button>
            {menuOpen ? (
              <div className={styles.menu} role="menu">
                <p>Skills help show how you fit new opportunities.</p>
              </div>
            ) : null}
          </div>
          {isOwner ? (
            <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label="Add skill">
              +
            </button>
          ) : null}
        </div>
      </header>

      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === "all" ? styles.tabActive : styles.tab}
          onClick={() => setTab("all")}
        >
          All
        </button>
        <button
          type="button"
          className={tab === "tools" ? styles.tabActive : styles.tab}
          onClick={() => setTab("tools")}
        >
          Tools & Technologies
        </button>
      </div>

      <div className={styles.body}>
        {visible.length === 0 ? (
          <p className={styles.empty}>
            {tab === "tools" ? "No tools or technologies added yet." : "No skills added yet."}
          </p>
        ) : (
          visible.map((skill) => {
            const associations = resolveSkillAssociations(skill, profile);
            return (
              <article key={skill._id || skill.name} className={styles.row}>
                <div className={styles.details}>
                  <h3>{skill.name}</h3>
                  {associations.length > 0 ? (
                    <p>{associations.map((item) => item.label).join(" · ")}</p>
                  ) : null}
                </div>
                {isOwner ? (
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => onEdit?.(skill)}
                    aria-label={`Edit ${skill.name}`}
                  >
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

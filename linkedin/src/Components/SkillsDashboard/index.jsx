import React, { useState } from "react";
import { listProfileSkills, resolveSkillAssociations } from "@/Components/SkillsSection/skillUtils";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

export default function SkillsDashboard({
  profile,
  isOwner = false,
  onBack,
  onAdd,
  onEdit,
}) {
  const { t } = useI18n();
  const [tab, setTab] = useState("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const skills = listProfileSkills(profile);
  const visible = tab === "tools" ? skills.filter((item) => item.category === "tools") : skills;

  return (
    <section className={styles.page} aria-labelledby="skills-dashboard-title">
      <header className={styles.header}>
        <button type="button" className={styles.iconBtn} onClick={onBack} aria-label={t("back")}>
          ←
        </button>
        <h2 id="skills-dashboard-title">{t("skills")}</h2>
        <div className={styles.headerActions}>
          <div className={styles.menuWrap}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={t("more")}
            >
              ⋯
            </button>
            {menuOpen ? (
              <div className={styles.menu} role="menu">
                <p>{t("skillsHelpMenu")}</p>
              </div>
            ) : null}
          </div>
          {isOwner ? (
            <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label={t("addSkill")}>
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
          {t("all")}
        </button>
        <button
          type="button"
          className={tab === "tools" ? styles.tabActive : styles.tab}
          onClick={() => setTab("tools")}
        >
          {t("toolsAndTech")}
        </button>
      </div>

      <div className={styles.body}>
        {visible.length === 0 ? (
          <p className={styles.empty}>
            {tab === "tools" ? t("noToolsYet") : t("noSkillsYet")}
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
                    aria-label={t("editNamed", { name: skill.name })}
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

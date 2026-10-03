import React from "react";
import { formatExperienceDates, isFilledExperience } from "@/Components/ExperienceRecordForm";
import { getMediaUrl } from "@/config/utils";
import styles from "./styles.module.css";

export default function ExperienceSection({
  profile,
  isOwner = false,
  onAdd,
  onOpenDetails,
  onOpenMedia,
}) {
  const experiences = (profile?.pastWork || []).filter(isFilledExperience);

  if (!isOwner && experiences.length === 0) return null;

  return (
    <section id="experience" className={styles.section}>
      {experiences.length === 0 ? (
        <>
          <h2>Experience</h2>
          <p className={styles.intro}>
            Showcase the roles you&apos;ve had so people understand your background and the impact you&apos;ve made.
          </p>
          {isOwner ? (
            <button type="button" className={styles.addBtn} onClick={onAdd}>
              Add experience
            </button>
          ) : null}
        </>
      ) : (
        <>
          <div className={styles.header}>
            <h2>Experience</h2>
            {isOwner ? (
              <div className={styles.actions}>
                <button type="button" className={styles.iconBtn} onClick={onAdd} aria-label="Add experience">+</button>
                <button type="button" className={styles.iconBtn} onClick={onOpenDetails} aria-label="Manage experience">✎</button>
              </div>
            ) : null}
          </div>
          <div className={experiences.length > 2 ? styles.listWithMore : undefined}>
            {experiences.slice(0, 2).map((entry, index) => {
              const skillNames = (entry.skills || []).map((item) => item?.name).filter(Boolean);
              const mediaItems = (entry.media || []).filter((item) => item?.url);
              const letter = (String(entry.company || entry.position || "?").trim()[0] || "?").toUpperCase();
              const workKey = entry._id ? String(entry._id) : `idx-${index}`;
              const dates = formatExperienceDates(entry);
              return (
                <article key={entry._id || index} className={styles.item}>
                  <span className={styles.avatar} aria-hidden="true">{letter}</span>
                  <div className={styles.body}>
                    <p className={styles.title}>{entry.position || "Experience"}</p>
                    {entry.company ? <p className={styles.meta}>{entry.company}</p> : null}
                    {entry.employmentType ? <p className={styles.meta}>{entry.employmentType}</p> : null}
                    {dates ? <p className={styles.meta}>{dates}</p> : null}
                    {entry.location || entry.locationType ? (
                      <p className={styles.meta}>{[entry.location, entry.locationType].filter(Boolean).join(" · ")}</p>
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
                              <img src={getMediaUrl(item.url)} alt="" className={styles.mediaImage} />
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
                </article>
              );
            })}
          </div>
          {experiences.length > 2 ? (
            <button type="button" className={styles.showAll} onClick={onOpenDetails}>
              Show all →
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

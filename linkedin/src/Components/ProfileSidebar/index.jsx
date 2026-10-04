import React from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import Avatar from "@/Components/Avatar";
import { isFilledEducation } from "@/Components/EducationRecordForm";
import { getMediaUrl } from "@/config/utils";
import { useI18n } from "@/i18n";
import styles from "./styles.module.css";

function getCardLocation(profile) {
  const introLocation = [profile?.intro?.city, profile?.intro?.country].filter(Boolean).join(", ");
  return introLocation || String(profile?.location || "").trim();
}

function getPrimaryEducation(profile) {
  const records = (profile?.education || []).filter(isFilledEducation);
  const introSchool = String(profile?.intro?.education || "").trim();
  if (introSchool) {
    const match = records.find((entry) => String(entry.school || "").trim() === introSchool);
    return match || { school: introSchool, media: [] };
  }
  return records[0] || null;
}

function getEducationLogo(entry) {
  const image = (entry?.media || []).find((item) => item?.type === "image" && item?.url);
  return image ? getMediaUrl(image.url) : "";
}

export default function ProfileSidebar() {
  const router = useRouter();
  const { t } = useI18n();
  const { profile } = useSelector((state) => state.profile);
  const user = profile?.userId;

  if (!profile) {
    return (
      <div className={styles.card}>
        <div className={styles.skeleton}>{t("loading")}</div>
      </div>
    );
  }

  const coverSrc = user?.coverPicture ? getMediaUrl(user.coverPicture) : "";
  const headline = String(profile.currentPost || "").trim();
  const location = getCardLocation(profile);
  const education = getPrimaryEducation(profile);
  const schoolName = String(education?.school || "").trim();
  const schoolLogo = education ? getEducationLogo(education) : "";
  const schoolLetter = (schoolName[0] || "?").toUpperCase();

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => router.push("/profile")}
    >
      <div className={styles.cover}>
        {coverSrc ? (
          <img src={coverSrc} alt="" className={styles.coverImage} />
        ) : (
          <div className={styles.coverFallback} />
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.photoWrap}>
          <Avatar user={user} size={72} />
        </div>
        {user?.name ? <p className={styles.name}>{user.name}</p> : null}
        {headline ? <p className={styles.headline}>{headline}</p> : null}
        {location ? <p className={styles.location}>{location}</p> : null}
        {schoolName ? (
          <div className={styles.school}>
            {schoolLogo ? (
              <img src={schoolLogo} alt="" className={styles.schoolLogo} />
            ) : (
              <span className={styles.schoolLetter} aria-hidden="true">{schoolLetter}</span>
            )}
            <span className={styles.schoolName}>{schoolName}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

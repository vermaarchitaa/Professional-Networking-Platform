import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import { fetchUserProfile, updateUserInfo } from "@/config/redux/action/profileAction";
import { getPublicProfileHref, getPublicProfilePath } from "@/config/utils";
import { validateUsername } from "@/config/validation";
import useAuthGuard from "@/hooks/useAuth";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import { tMessage, useI18n } from "@/i18n";
import styles from "./style.module.css";

export default function ProfileUrlPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const savingRef = useRef(false);
  const { profile, isLoading, isError, message } = useSelector((state) => state.profile);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useI18n();

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile?.userId?.username) setUsername(profile.userId.username);
  }, [profile?.userId?.username]);

  if (isLoading && !profile) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <ProfileFormSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  const currentUsername = profile?.userId?.username || "";
  const previewHref = getPublicProfileHref(username.trim() || currentUsername);
  const previewPath = getPublicProfilePath(username.trim() || currentUsername);

  const handleSave = async () => {
    if (savingRef.current) return;
    const nextUsername = username.trim();
    const usernameError = validateUsername(nextUsername);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    setError("");
    setSaved(false);
    const result = await dispatch(updateUserInfo({
      name: profile?.userId?.name,
      username: nextUsername,
      email: profile?.userId?.email,
    }));
    savingRef.current = false;
    setSaving(false);
    if (updateUserInfo.rejected.match(result)) {
      setError(result.payload?.message || "Failed to update profile URL");
      return;
    }
    setSaved(true);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <button type="button" className={styles.backBtn} onClick={() => router.push("/profile")}>
          {t("backToProfile")}
        </button>

        <section className={styles.card}>
          <h1>{t("profileUrl")}</h1>
          <p className={styles.lead}>
            {t("profileUrlLead")}
          </p>

          <div className={styles.preview}>
            <p className={styles.previewLabel}>{t("currentProfileUrl")}</p>
            {currentUsername ? (
              <a
                className={styles.previewLink}
                href={getPublicProfilePath(currentUsername)}
                target="_blank"
                rel="noreferrer"
              >
                {getPublicProfileHref(currentUsername)}
              </a>
            ) : (
              <p className={styles.previewEmpty}>{t("noProfileUrlYet")}</p>
            )}
          </div>

          <label className={styles.field}>
            {t("customProfileUrl")}
            <div className={styles.urlRow}>
              <span className={styles.urlPrefix}>
                {typeof window !== "undefined" ? `${window.location.origin}/in/` : "/in/"}
              </span>
              <input
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setError("");
                  setSaved(false);
                }}
                autoComplete="username"
                spellCheck={false}
              />
            </div>
          </label>

          <div className={styles.preview}>
            <p className={styles.previewLabel}>{t("profileUrlPreview")}</p>
            {previewHref ? (
              <a className={styles.previewLink} href={previewPath} target="_blank" rel="noreferrer">
                {previewHref}
              </a>
            ) : (
              <p className={styles.previewEmpty}>{t("enterUsernamePreview")}</p>
            )}
          </div>

          {error ? <p className={styles.error}>{tMessage(t, error)}</p> : null}
          {saved && !isError ? <p className={styles.success}>{tMessage(t, message) || t("profileUrlUpdated")}</p> : null}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.push("/profile")}>
              {t("cancel")}
            </button>
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving || username.trim() === currentUsername}
              aria-busy={saving}
            >
              {saving ? t("saving") : t("save")}
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}

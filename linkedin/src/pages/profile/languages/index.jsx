import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import EditLanguageModal from "@/Components/EditLanguageModal";
import LanguagesDashboard from "@/Components/LanguagesDashboard";
import { cleanLanguage, isFilledLanguage } from "@/Components/LanguageRecordForm";
import {
  fetchProfileByUsername,
  fetchUserProfile,
  updateProfileData,
} from "@/config/redux/action/profileAction";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import useAuthGuard from "@/hooks/useAuth";
import { clearViewedProfile } from "@/config/redux/reducer/profileReducer";
import styles from "../education/style.module.css";

export default function LanguagesDetailsPage({ publicUsername = "" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    profile: ownProfile,
    viewedProfile,
    viewedError,
  } = useSelector((state) => state.profile);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [languageSaving, setLanguageSaving] = useState(false);
  const [languageError, setLanguageError] = useState("");
  const [languageTarget, setLanguageTarget] = useState(null);

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
    if (publicUsername) {
      dispatch(fetchProfileByUsername(publicUsername));
    } else {
      dispatch(clearViewedProfile());
    }
  }, [dispatch, publicUsername]);

  const isPublicRoute = Boolean(publicUsername);
  const isOwner = !isPublicRoute || Boolean(
    ownProfile?.userId?.username && publicUsername && ownProfile.userId.username === publicUsername
  );
  const profile = isPublicRoute && !isOwner ? viewedProfile : ownProfile;
  const backHref = isPublicRoute ? `/in/${publicUsername}` : "/profile";

  const serializeLanguages = (list) =>
    (list || []).map((entry) => {
      const cleaned = cleanLanguage(entry);
      if (entry?._id) return { ...cleaned, _id: entry._id };
      return cleaned;
    });

  const persistLanguage = async (cleaned, target) => {
    const current = serializeLanguages(profile?.languages);
    const next = !target
      ? [...current, cleaned]
      : current.map((entry, index) => {
        const match = target._id
          ? String(entry._id) === target._id
          : index === target.index;
        return match ? { ...cleaned, ...(entry._id ? { _id: entry._id } : {}) } : entry;
      });

    setLanguageSaving(true);
    setLanguageError("");
    const result = await dispatch(updateProfileData({ languages: next }));
    setLanguageSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setLanguageOpen(false);
      setLanguageTarget(null);
      return;
    }
    setLanguageError(result.payload?.message || "Failed to save language");
  };

  const openAddLanguage = () => {
    if (!isOwner) return;
    setLanguageError("");
    setLanguageTarget(null);
    setLanguageOpen(true);
  };

  const openEditLanguage = (entry) => {
    if (!isOwner) return;
    const list = profile?.languages || [];
    const index = entry?._id
      ? list.findIndex((item) => String(item._id) === String(entry._id))
      : list.indexOf(entry);
    setLanguageError("");
    setLanguageTarget({
      _id: entry?._id ? String(entry._id) : "",
      index: index >= 0 ? index : 0,
    });
    setLanguageOpen(true);
  };

  const handleDeleteLanguage = async () => {
    if (!languageTarget) return;
    const current = serializeLanguages(profile?.languages);
    const next = languageTarget._id
      ? current.filter((entry) => String(entry._id) !== languageTarget._id)
      : current.filter((_, index) => index !== languageTarget.index);
    setLanguageSaving(true);
    setLanguageError("");
    const result = await dispatch(updateProfileData({ languages: next }));
    setLanguageSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setLanguageOpen(false);
      setLanguageTarget(null);
      return;
    }
    setLanguageError(result.payload?.message || "Failed to delete language");
  };

  if (
    (!isPublicRoute && !ownProfile)
    || (isPublicRoute && !viewedProfile && !viewedError)
  ) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <ProfileFormSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (isPublicRoute && !viewedProfile) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <section className={styles.page}>
            <h2>Profile not available</h2>
            <p>{viewedError || "This profile URL is not available."}</p>
          </section>
        </div>
      </DashboardLayout>
    );
  }

  const visibleLanguages = (profile?.languages || []).filter(isFilledLanguage);
  const languageInitial = languageTarget
    ? (
      (languageTarget._id
        ? (profile?.languages || []).find((entry) => String(entry._id) === languageTarget._id)
        : null)
      || (profile?.languages || [])[languageTarget.index]
      || null
    )
    : null;
  const existingLanguages = visibleLanguages.filter((entry) => (
    languageTarget
      ? (languageTarget._id
        ? String(entry._id) !== languageTarget._id
        : visibleLanguages.indexOf(entry) !== languageTarget.index)
      : true
  ));

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <LanguagesDashboard
          entries={visibleLanguages}
          onClose={() => router.push(backHref)}
          onAdd={isOwner ? openAddLanguage : undefined}
          onEdit={isOwner ? openEditLanguage : undefined}
        />
        {isOwner ? (
          <EditLanguageModal
            isOpen={languageOpen}
            initialValue={languageInitial}
            existingLanguages={existingLanguages}
            isSaving={languageSaving}
            error={languageError}
            onClose={() => !languageSaving && setLanguageOpen(false)}
            onSave={(cleaned) => persistLanguage(cleaned, languageTarget)}
            onDelete={handleDeleteLanguage}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

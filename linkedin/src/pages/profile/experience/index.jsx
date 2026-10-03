import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import EditExperienceModal from "@/Components/EditExperienceModal";
import ExperienceDashboard from "@/Components/ExperienceDashboard";
import EducationMediaViewer from "@/Components/EducationMediaViewer";
import {
  cleanExperience,
  isFilledExperience,
  syncProfileSkillsForExperience,
} from "@/Components/ExperienceRecordForm";
import {
  fetchProfileByUsername,
  fetchUserProfile,
  updateProfileData,
} from "@/config/redux/action/profileAction";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import useAuthGuard from "@/hooks/useAuth";
import { clearViewedProfile } from "@/config/redux/reducer/profileReducer";
import styles from "../education/style.module.css";

export default function ExperienceDetailsPage({ publicUsername = "" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    profile: ownProfile,
    viewedProfile,
    viewedError,
  } = useSelector((state) => state.profile);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [experienceSaving, setExperienceSaving] = useState(false);
  const [experienceError, setExperienceError] = useState("");
  const [experienceTarget, setExperienceTarget] = useState(null);
  const [mediaViewer, setMediaViewer] = useState(null);

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

  const serializeWork = (list) =>
    (list || []).map((entry) => {
      const cleaned = cleanExperience(entry);
      if (entry?._id) return { ...cleaned, _id: entry._id };
      return cleaned;
    });

  const persistExperience = async (cleaned, target) => {
    const current = serializeWork(profile?.pastWork);
    const next = !target
      ? [...current, cleaned]
      : current.map((entry, index) => {
        const match = target._id
          ? String(entry._id) === target._id
          : index === target.index;
        return match ? { ...cleaned, ...(entry._id ? { _id: entry._id } : {}) } : entry;
      });

    setExperienceSaving(true);
    setExperienceError("");
    const result = await dispatch(updateProfileData({ pastWork: next }));
    if (updateProfileData.rejected.match(result)) {
      setExperienceSaving(false);
      setExperienceError(result.payload?.message || "Failed to save experience");
      return false;
    }
    const refreshed = await dispatch(fetchUserProfile());
    const latest = refreshed.payload || {};
    const saved = target?._id
      ? (latest.pastWork || []).find((entry) => String(entry._id) === target._id)
      : (latest.pastWork || []).find((entry) => (
        entry.company === cleaned.company
        && entry.position === cleaned.position
        && entry.startDate === cleaned.startDate
      ));
    if (saved?._id) {
      const skills = syncProfileSkillsForExperience(
        latest.skills,
        saved._id,
        (cleaned.skills || []).map((item) => item.name)
      );
      await dispatch(updateProfileData({ skills }));
    }
    setExperienceSaving(false);
    setExperienceOpen(false);
    setExperienceTarget(null);
    return true;
  };

  const openAddExperience = () => {
    if (!isOwner) return;
    setExperienceError("");
    setExperienceTarget(null);
    setExperienceOpen(true);
  };

  const openEditExperience = (entry) => {
    if (!isOwner) return;
    const list = profile?.pastWork || [];
    const index = entry?._id
      ? list.findIndex((item) => String(item._id) === String(entry._id))
      : list.indexOf(entry);
    setExperienceError("");
    setExperienceTarget({
      _id: entry?._id ? String(entry._id) : "",
      index: index >= 0 ? index : 0,
    });
    setExperienceOpen(true);
  };

  const handleDeleteExperience = async () => {
    if (!experienceTarget) return;
    const current = serializeWork(profile?.pastWork);
    const next = experienceTarget._id
      ? current.filter((entry) => String(entry._id) !== experienceTarget._id)
      : current.filter((_, index) => index !== experienceTarget.index);
    setExperienceSaving(true);
    setExperienceError("");
    const result = await dispatch(updateProfileData({ pastWork: next }));
    setExperienceSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setExperienceOpen(false);
      setExperienceTarget(null);
      return;
    }
    setExperienceError(result.payload?.message || "Failed to delete experience");
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

  const visibleWork = (profile?.pastWork || []).filter(isFilledExperience);
  const viewerWork = mediaViewer
    ? visibleWork.find((entry, index) => (entry._id ? String(entry._id) : `idx-${index}`) === mediaViewer.workKey)
    : null;
  const viewerMediaItems = (viewerWork?.media || []).filter((item) => item?.url);
  const experienceInitial = experienceTarget
    ? (
      (experienceTarget._id
        ? (profile?.pastWork || []).find((entry) => String(entry._id) === experienceTarget._id)
        : null)
      || (profile?.pastWork || [])[experienceTarget.index]
      || null
    )
    : null;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <ExperienceDashboard
          entries={visibleWork}
          onClose={() => router.push(backHref)}
          onAdd={isOwner ? openAddExperience : undefined}
          onEdit={isOwner ? openEditExperience : undefined}
          onOpenMedia={setMediaViewer}
        />
        {viewerMediaItems.length > 0 ? (
          <EducationMediaViewer
            items={viewerMediaItems}
            index={Math.min(mediaViewer.mediaIndex, viewerMediaItems.length - 1)}
            onClose={() => setMediaViewer(null)}
            onIndexChange={(nextIndex) => setMediaViewer((current) => (
              current ? { ...current, mediaIndex: nextIndex } : current
            ))}
          />
        ) : null}
        {isOwner ? (
          <EditExperienceModal
            isOpen={experienceOpen}
            initialValue={experienceInitial}
            profile={profile}
            isSaving={experienceSaving}
            error={experienceError}
            onClose={() => !experienceSaving && setExperienceOpen(false)}
            onSave={(cleaned) => persistExperience(cleaned, experienceTarget)}
            onDelete={handleDeleteExperience}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

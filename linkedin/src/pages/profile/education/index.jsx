import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import EducationDashboard from "@/Components/EducationDashboard";
import EducationMediaViewer from "@/Components/EducationMediaViewer";
import EditEducationModal from "@/Components/EditEducationModal";
import { cleanEducation } from "@/Components/EducationRecordForm";
import {
  fetchUserProfile,
  fetchProfileByUsername,
  updateProfileData,
} from "@/config/redux/action/profileAction";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import useAuthGuard from "@/hooks/useAuth";
import { clearViewedProfile } from "@/config/redux/reducer/profileReducer";
import styles from "./style.module.css";

export default function EducationDetailsPage({ publicUsername = "" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    profile: ownProfile,
    viewedProfile,
    viewedError,
  } = useSelector((state) => state.profile);
  const [educationOpen, setEducationOpen] = useState(false);
  const [educationSaving, setEducationSaving] = useState(false);
  const [educationError, setEducationError] = useState("");
  const [educationTarget, setEducationTarget] = useState(null);
  const [educationMediaViewer, setEducationMediaViewer] = useState(null);

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

  const serializeEducationList = (list) =>
    (list || []).map((entry) => {
      const cleaned = cleanEducation(entry);
      if (entry?._id) return { ...cleaned, _id: entry._id };
      return cleaned;
    });

  const openAddEducation = () => {
    if (!isOwner) return;
    setEducationError("");
    setEducationTarget(null);
    setEducationOpen(true);
  };

  const openEditEducation = (entry) => {
    if (!isOwner) return;
    const list = profile?.education || [];
    const index = entry?._id
      ? list.findIndex((item) => String(item._id) === String(entry._id))
      : list.indexOf(entry);
    setEducationError("");
    setEducationTarget({
      _id: entry?._id ? String(entry._id) : "",
      index: index >= 0 ? index : 0,
    });
    setEducationOpen(true);
  };

  const closeEducationEditor = () => {
    if (educationSaving) return;
    setEducationError("");
    setEducationOpen(false);
    setEducationTarget(null);
  };

  const handleSaveEducation = async (cleaned) => {
    const current = serializeEducationList(profile?.education);
    let next;
    if (!educationTarget) {
      next = [...current, cleaned];
    } else {
      const byId = educationTarget._id
        ? current.findIndex((entry) => String(entry._id) === educationTarget._id)
        : -1;
      const index = byId >= 0 ? byId : educationTarget.index;
      next = current.map((entry, i) => (
        i === index
          ? { ...cleaned, ...(entry._id ? { _id: entry._id } : {}) }
          : entry
      ));
    }

    setEducationSaving(true);
    setEducationError("");
    const result = await dispatch(updateProfileData({ education: next }));
    setEducationSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setEducationOpen(false);
      setEducationTarget(null);
      return;
    }
    setEducationError(result.payload?.message || "Failed to save education");
  };

  const handleDeleteEducation = async () => {
    if (!educationTarget) return;
    const current = serializeEducationList(profile?.education);
    const next = educationTarget._id
      ? current.filter((entry) => String(entry._id) !== educationTarget._id)
      : current.filter((_, index) => index !== educationTarget.index);

    setEducationSaving(true);
    setEducationError("");
    const result = await dispatch(updateProfileData({ education: next }));
    setEducationSaving(false);
    if (updateProfileData.fulfilled.match(result)) {
      setEducationOpen(false);
      setEducationTarget(null);
      return;
    }
    setEducationError(result.payload?.message || "Failed to delete education");
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

  const visibleEdu = (profile?.education || []).filter((e) => String(e?.school || "").trim());
  const viewerEducation = educationMediaViewer
    ? visibleEdu.find((edu, index) => (edu._id ? String(edu._id) : `idx-${index}`) === educationMediaViewer.eduKey)
    : null;
  const viewerMediaItems = (viewerEducation?.media || []).filter((item) => item?.url);
  const educationInitial = educationTarget
    ? (
      (educationTarget._id
        ? (profile?.education || []).find((entry) => String(entry._id) === educationTarget._id)
        : null)
      || (profile?.education || [])[educationTarget.index]
      || null
    )
    : null;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <EducationDashboard
          asPage
          entries={visibleEdu}
          onClose={() => router.push(backHref)}
          onAdd={isOwner ? openAddEducation : undefined}
          onEdit={isOwner ? openEditEducation : undefined}
          onOpenMedia={setEducationMediaViewer}
        />
        {viewerMediaItems.length > 0 ? (
          <EducationMediaViewer
            items={viewerMediaItems}
            index={Math.min(educationMediaViewer.mediaIndex, viewerMediaItems.length - 1)}
            onClose={() => setEducationMediaViewer(null)}
            onIndexChange={(nextIndex) => setEducationMediaViewer((current) => (
              current ? { ...current, mediaIndex: nextIndex } : current
            ))}
          />
        ) : null}
        {isOwner ? (
          <EditEducationModal
            isOpen={educationOpen}
            initialValue={educationInitial}
            isSaving={educationSaving}
            error={educationError}
            onClose={closeEducationEditor}
            onSave={handleSaveEducation}
            onDelete={handleDeleteEducation}
          />
        ) : null}
      </div>
    </DashboardLayout>
  );
}

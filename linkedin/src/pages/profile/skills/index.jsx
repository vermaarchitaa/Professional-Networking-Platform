import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import AddSkillModal from "@/Components/AddSkillModal";
import EditSkillModal from "@/Components/EditSkillModal";
import SkillsDashboard from "@/Components/SkillsDashboard";
import { listProfileSkills } from "@/Components/SkillsSection/skillUtils";
import {
  addProfileSkill,
  deleteProfileSkill,
  fetchProfileByUsername,
  fetchUserProfile,
  updateProfileSkill,
} from "@/config/redux/action/profileAction";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import useAuthGuard from "@/hooks/useAuth";
import { clearViewedProfile } from "@/config/redux/reducer/profileReducer";
import styles from "../education/style.module.css";

export default function SkillsDetailsPage({ publicUsername = "" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const {
    profile: ownProfile,
    viewedProfile,
    viewedError,
  } = useSelector((state) => state.profile);
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState("");
  const [editSkill, setEditSkill] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

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
  const existingNames = listProfileSkills(profile).map((item) => item.name);

  const handleAddSkill = async (name) => {
    setAddSaving(true);
    setAddError("");
    const result = await dispatch(addProfileSkill(name));
    setAddSaving(false);
    if (addProfileSkill.fulfilled.match(result)) {
      setAddOpen(false);
      return;
    }
    setAddError(result.payload?.message || "Failed to add skill");
  };

  const handleSaveAssociations = async (associations) => {
    if (!editSkill?._id) return;
    setEditSaving(true);
    setEditError("");
    const result = await dispatch(updateProfileSkill({ skillId: editSkill._id, associations }));
    setEditSaving(false);
    if (updateProfileSkill.fulfilled.match(result)) {
      setEditSkill(null);
      return;
    }
    setEditError(result.payload?.message || "Failed to update skill");
  };

  const handleDeleteSkill = async () => {
    if (!editSkill?._id) return;
    setEditSaving(true);
    setEditError("");
    const result = await dispatch(deleteProfileSkill(editSkill._id));
    setEditSaving(false);
    if (deleteProfileSkill.fulfilled.match(result)) {
      setEditSkill(null);
      return;
    }
    setEditError(result.payload?.message || "Failed to delete skill");
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

  const currentEdit = editSkill
    ? listProfileSkills(profile).find((item) => String(item._id) === String(editSkill._id)) || editSkill
    : null;

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <SkillsDashboard
          profile={profile}
          isOwner={isOwner}
          onBack={() => router.push(backHref)}
          onAdd={() => {
            setAddError("");
            setAddOpen(true);
          }}
          onEdit={(skill) => {
            setEditError("");
            setEditSkill(skill);
          }}
        />
        {isOwner ? (
          <>
            <AddSkillModal
              isOpen={addOpen}
              profile={profile}
              existingNames={existingNames}
              isSaving={addSaving}
              error={addError}
              onClose={() => !addSaving && setAddOpen(false)}
              onSave={handleAddSkill}
            />
            <EditSkillModal
              isOpen={Boolean(currentEdit)}
              skill={currentEdit}
              profile={profile}
              isSaving={editSaving}
              error={editError}
              onClose={() => !editSaving && setEditSkill(null)}
              onSave={handleSaveAssociations}
              onDelete={handleDeleteSkill}
            />
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
}

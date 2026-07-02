import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import DashboardLayout from "@/layout/DashboardLayout";
import Avatar from "@/Components/Avatar";
import {
  fetchUserProfile,
  updateProfileData,
  updateUserInfo,
  uploadProfilePicture,
  downloadResume,
} from "@/config/redux/action/profileAction";
import { ProfileFormSkeleton } from "@/Components/Skeleton";
import { validateProfile } from "@/config/validation";
import useAuthGuard from "@/hooks/useAuth";
import styles from "./style.module.css";

const emptyWork = { company: "", position: "", years: "" };
const emptyEducation = { school: "", degree: "", fieldOfStudy: "" };

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { profile, message, isLoading } = useSelector((state) => state.profile);
  const [bio, setBio] = useState("");
  const [currentPost, setCurrentPost] = useState("");
  const [pastWork, setPastWork] = useState([{ ...emptyWork }]);
  const [education, setEducation] = useState([{ ...emptyEducation }]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  useAuthGuard();

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  useEffect(() => {
    if (!profile) return;
    setBio(profile.bio || "");
    setCurrentPost(profile.currentPost || "");
    setPastWork(profile.pastWork?.length ? profile.pastWork : [{ ...emptyWork }]);
    setEducation(profile.education?.length ? profile.education : [{ ...emptyEducation }]);
    setName(profile.userId?.name || "");
    setUsername(profile.userId?.username || "");
    setEmail(profile.userId?.email || "");
  }, [profile]);

  useEffect(() => {
    if (message) {
      setSaved(true);
      const timer = setTimeout(() => setSaved(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSave = () => {
    const errors = validateProfile({ name, username, email });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    dispatch(updateUserInfo({ name, username, email }));
    dispatch(updateProfileData({ bio, currentPost, pastWork, education }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) dispatch(uploadProfilePicture(file));
  };

  const updateWork = (index, field, value) => {
    const updated = [...pastWork];
    updated[index] = { ...updated[index], [field]: value };
    setPastWork(updated);
  };

  const updateEdu = (index, field, value) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  if (isLoading && !profile) {
    return (
      <DashboardLayout>
        <div className={styles.container}>
          <ProfileFormSkeleton />
          <ProfileFormSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Avatar user={profile?.userId} size={96} />
          <div className={styles.headerInfo}>
            <h1>{profile?.userId?.name}</h1>
            <p>@{profile?.userId?.username}</p>
          </div>
          <label className={styles.uploadBtn}>
            Change Photo
            <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </label>
        </div>

        {saved && <p className={styles.success}>{message}</p>}

        <section className={styles.section}>
          <h2>Basic Info</h2>
          <div className={styles.grid}>
            <div className={styles.fieldWrap}>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" }); }}
                className={fieldErrors.name ? styles.inputError : ""}
              />
              {fieldErrors.name && <span className={styles.fieldError}>{fieldErrors.name}</span>}
            </div>
            <div className={styles.fieldWrap}>
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (fieldErrors.username) setFieldErrors({ ...fieldErrors, username: "" }); }}
                className={fieldErrors.username ? styles.inputError : ""}
              />
              {fieldErrors.username && <span className={styles.fieldError}>{fieldErrors.username}</span>}
            </div>
            <div className={`${styles.fieldWrap} ${styles.fullWidth}`}>
              <input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" }); }}
                className={fieldErrors.email ? styles.inputError : ""}
              />
              {fieldErrors.email && <span className={styles.fieldError}>{fieldErrors.email}</span>}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2>About</h2>
          <textarea
            placeholder="Write a short bio..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
          />
          <input
            placeholder="Current position (e.g. Software Engineer at Google)"
            value={currentPost}
            onChange={(e) => setCurrentPost(e.target.value)}
          />
        </section>

        <section className={styles.section}>
          <h2>Work Experience</h2>
          {pastWork.map((work, i) => (
            <div key={i} className={styles.entryRow}>
              <input placeholder="Company" value={work.company} onChange={(e) => updateWork(i, "company", e.target.value)} />
              <input placeholder="Position" value={work.position} onChange={(e) => updateWork(i, "position", e.target.value)} />
              <input placeholder="Years" value={work.years} onChange={(e) => updateWork(i, "years", e.target.value)} />
            </div>
          ))}
          <button className={styles.addBtn} onClick={() => setPastWork([...pastWork, { ...emptyWork }])}>
            + Add Experience
          </button>
        </section>

        <section className={styles.section}>
          <h2>Education</h2>
          {education.map((edu, i) => (
            <div key={i} className={styles.entryRow}>
              <input placeholder="School" value={edu.school} onChange={(e) => updateEdu(i, "school", e.target.value)} />
              <input placeholder="Degree" value={edu.degree} onChange={(e) => updateEdu(i, "degree", e.target.value)} />
              <input placeholder="Years / Field" value={edu.fieldOfStudy} onChange={(e) => updateEdu(i, "fieldOfStudy", e.target.value)} />
            </div>
          ))}
          <button className={styles.addBtn} onClick={() => setEducation([...education, { ...emptyEducation }])}>
            + Add Education
          </button>
        </section>

        <div className={styles.actions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            Save Profile
          </button>
          <button
            className={styles.downloadBtn}
            onClick={() => dispatch(downloadResume(profile?.userId?._id))}
          >
            Download Resume (PDF)
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

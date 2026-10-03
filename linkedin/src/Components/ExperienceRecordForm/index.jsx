import React from "react";
import {
  EDUCATION_MEDIA_DESCRIPTION_MAX,
  EDUCATION_MEDIA_NAME_MAX,
} from "@/Components/EducationRecordForm";
import styles from "@/Components/EducationRecordForm/styles.module.css";

export const EXPERIENCE_DESCRIPTION_MAX = 2000;
export const EXPERIENCE_SKILLS_LIMIT = 5;
export const EXPERIENCE_LOCATION_TYPES = ["On-site", "Hybrid", "Remote"];
export const EXPERIENCE_EMPLOYMENT_TYPES = [
  "Full-time", "Part-time", "Self-employed", "Freelance", "Contract", "Internship", "Apprenticeship", "Seasonal",
];
export const EXPERIENCE_JOB_SOURCES = ["LinkedIn", "Company website", "Referral", "Recruiter", "Other"];

export const emptyExperience = {
  company: "",
  position: "",
  years: "",
  location: "",
  locationType: "",
  employmentType: "",
  jobSource: "",
  current: false,
  startDate: "",
  endDate: "",
  description: "",
  skills: [],
  media: [],
};

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1969 + 2 }, (_, index) => String(currentYear + 1 - index));

function splitYearMonth(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return { year: "", month: "" };
  return { year: match[1], month: match[2] };
}

function joinYearMonth(year, month) {
  if (!year || !month) return "";
  return `${year}-${month}`;
}

function formatYearMonth(value) {
  const { year, month } = splitYearMonth(value);
  const monthLabel = MONTHS.find((item) => item.value === month)?.label;
  if (monthLabel && year) return `${monthLabel} ${year}`;
  return year || "";
}

export function isFilledExperience(entry) {
  return Boolean(String(entry?.company || entry?.position || entry?.years || "").trim());
}

export function formatExperienceDates(entry) {
  const start = formatYearMonth(entry?.startDate);
  if (entry?.current) return start ? `${start} – Present` : "Present";
  const end = formatYearMonth(entry?.endDate);
  if (start || end) return [start, end].filter(Boolean).join(" – ");
  return String(entry?.years || "").trim();
}

const cleanSkills = (skills) => {
  const seen = new Set();
  const next = [];
  (Array.isArray(skills) ? skills : []).forEach((item) => {
    const name = String(item?.name || item || "").trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key) || next.length >= EXPERIENCE_SKILLS_LIMIT) return;
    seen.add(key);
    next.push({ name: name.slice(0, 80) });
  });
  return next;
};

const cleanMedia = (media) => (
  (Array.isArray(media) ? media : []).map((item) => ({
    type: ["link", "image", "document"].includes(item?.type) ? item.type : "link",
    url: String(item?.url || "").trim(),
    name: String(item?.name || "").trim().slice(0, EDUCATION_MEDIA_NAME_MAX),
    description: String(item?.description || "").trim().slice(0, EDUCATION_MEDIA_DESCRIPTION_MAX),
  })).filter((item) => item.url)
);

export function cleanExperience(entry) {
  const current = Boolean(entry?.current);
  const startDate = String(entry?.startDate || "").trim();
  const endDate = current ? "" : String(entry?.endDate || "").trim();
  return {
    company: String(entry?.company || "").trim(),
    position: String(entry?.position || "").trim(),
    location: String(entry?.location || "").trim(),
    locationType: String(entry?.locationType || "").trim(),
    employmentType: String(entry?.employmentType || "").trim(),
    jobSource: String(entry?.jobSource || "").trim(),
    current,
    startDate,
    endDate,
    description: String(entry?.description || "").trim().slice(0, EXPERIENCE_DESCRIPTION_MAX),
    years: formatExperienceDates({ ...entry, current, startDate, endDate }),
    skills: cleanSkills(entry?.skills),
    media: cleanMedia(entry?.media),
  };
}

export function syncProfileSkillsForExperience(profileSkills, experienceId, selectedNames) {
  const names = (selectedNames || []).map((name) => String(name || "").trim()).filter(Boolean);
  const selected = new Set(names.map((name) => name.toLowerCase()));
  const refId = experienceId ? String(experienceId) : "";
  const next = (profileSkills || []).map((skill) => {
    const associations = (skill.associations || []).filter((item) => !(
      item.kind === "experience" && refId && String(item.refId) === refId
    ));
    if (refId && selected.has(String(skill.name || "").toLowerCase())) {
      associations.push({ kind: "experience", refId });
    }
    return {
      ...(skill._id ? { _id: skill._id } : {}),
      name: skill.name,
      category: skill.category || "",
      associations,
    };
  });
  names.forEach((name) => {
    if (next.some((skill) => String(skill.name || "").toLowerCase() === name.toLowerCase())) return;
    next.push({
      name,
      category: "",
      associations: refId ? [{ kind: "experience", refId }] : [],
    });
  });
  return next;
}

export function experienceSkillsFromProfile(profile, experience) {
  const fromRecord = cleanSkills(experience?.skills);
  const experienceId = experience?._id ? String(experience._id) : "";
  const fromProfile = (profile?.skills || [])
    .filter((skill) => (skill.associations || []).some((item) => (
      item.kind === "experience" && experienceId && String(item.refId) === experienceId
    )))
    .map((skill) => ({ name: String(skill.name || "").trim() }))
    .filter((item) => item.name);
  return cleanSkills([...fromRecord, ...fromProfile]);
}

export default function ExperienceRecordForm({ value, onChange, error }) {
  const start = splitYearMonth(value.startDate);
  const end = splitYearMonth(value.endDate);
  const patch = (field, next) => onChange({ ...value, [field]: next });
  const description = value.description || "";

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        Title*
        <input
          value={value.position || ""}
          onChange={(event) => patch("position", event.target.value)}
          placeholder="Ex: Software Engineer"
        />
      </label>
      <label className={styles.field}>
        Employment type
        <select value={value.employmentType || ""} onChange={(event) => patch("employmentType", event.target.value)}>
          <option value="">Please select</option>
          {EXPERIENCE_EMPLOYMENT_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        Company name*
        <input
          value={value.company || ""}
          onChange={(event) => patch("company", event.target.value)}
          placeholder="Ex: Microsoft"
        />
      </label>
      <label className={styles.field}>
        Location
        <input
          value={value.location || ""}
          onChange={(event) => patch("location", event.target.value)}
          placeholder="Ex: Ghaziabad, Uttar Pradesh, India"
        />
      </label>
      <label className={styles.field}>
        Location type
        <select value={value.locationType || ""} onChange={(event) => patch("locationType", event.target.value)}>
          <option value="">Please select</option>
          {EXPERIENCE_LOCATION_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </label>
      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={Boolean(value.current)}
          onChange={(event) => onChange({
            ...value,
            current: event.target.checked,
            endDate: event.target.checked ? "" : value.endDate,
          })}
        />
        I am currently working in this role
      </label>
      <div className={styles.row}>
        <label className={styles.field}>
          Start month
          <select
            value={start.month}
            onChange={(event) => patch("startDate", joinYearMonth(start.year || String(currentYear), event.target.value))}
          >
            <option value="">Month</option>
            {MONTHS.map((month) => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Start year
          <select
            value={start.year}
            onChange={(event) => patch("startDate", joinYearMonth(event.target.value, start.month || "01"))}
          >
            <option value="">Year</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>
      {value.current ? null : (
        <div className={styles.row}>
          <label className={styles.field}>
            End month
            <select
              value={end.month}
              onChange={(event) => patch("endDate", joinYearMonth(end.year || String(currentYear), event.target.value))}
            >
              <option value="">Month</option>
              {MONTHS.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            End year
            <select
              value={end.year}
              onChange={(event) => patch("endDate", joinYearMonth(event.target.value, end.month || "01"))}
            >
              <option value="">Year</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      )}
      <label className={styles.field}>
        Description
        <textarea
          rows={4}
          value={description}
          maxLength={EXPERIENCE_DESCRIPTION_MAX}
          onChange={(event) => patch("description", event.target.value.slice(0, EXPERIENCE_DESCRIPTION_MAX))}
          placeholder="List your major contributions and achievements"
        />
        <span className={styles.counter}>{description.length.toLocaleString("en-US")}/{EXPERIENCE_DESCRIPTION_MAX.toLocaleString("en-US")}</span>
      </label>
      <label className={styles.field}>
        Where did you find this job
        <select value={value.jobSource || ""} onChange={(event) => patch("jobSource", event.target.value)}>
          <option value="">Please select</option>
          {EXPERIENCE_JOB_SOURCES.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

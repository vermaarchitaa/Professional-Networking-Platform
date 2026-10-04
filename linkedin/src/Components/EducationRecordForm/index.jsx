import React from "react";
import { getMonthOptions, tMessage, toIntlLocale, useI18n } from "@/i18n";
import styles from "./styles.module.css";

export const EDUCATION_DESCRIPTION_MAX = 1000;
export const EDUCATION_GRADE_MAX = 80;
export const EDUCATION_ACTIVITIES_MAX = 500;
export const EDUCATION_SKILLS_LIMIT = 5;
export const EDUCATION_MEDIA_NAME_MAX = 200;
export const EDUCATION_MEDIA_DESCRIPTION_MAX = 2000;

export const emptyEducation = {
  school: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  current: false,
  grade: "",
  activitiesAndSocieties: "",
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

function formatYearMonth(value, language = "en") {
  const { year, month } = splitYearMonth(value);
  if (month && year) {
    const monthIndex = Number(month) - 1;
    const monthLabel = new Intl.DateTimeFormat(toIntlLocale(language), { month: "long" }).format(new Date(2000, monthIndex, 1));
    return `${monthLabel} ${year}`;
  }
  return year || "";
}

export function isFilledEducation(entry) {
  return Boolean(String(entry?.school || "").trim());
}

export function educationLabel(entry, fallback = "Education") {
  return [entry?.school, entry?.degree, entry?.fieldOfStudy].filter(Boolean).join(" · ") || fallback;
}

export function formatEducationDates(entry, language = "en", presentLabel = "Present") {
  const start = formatYearMonth(entry?.startDate, language);
  if (entry?.current) return start ? `${start} – ${presentLabel}` : presentLabel;
  const end = formatYearMonth(entry?.endDate, language);
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" – ");
}

const cleanSkills = (skills) => {
  const seen = new Set();
  const next = [];
  (Array.isArray(skills) ? skills : []).forEach((item) => {
    const name = String(item?.name || item || "").trim();
    const key = name.toLowerCase();
    if (!name || seen.has(key) || next.length >= EDUCATION_SKILLS_LIMIT) return;
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

export function cleanEducation(entry) {
  const current = Boolean(entry?.current);
  return {
    school: String(entry?.school || "").trim(),
    degree: String(entry?.degree || "").trim(),
    fieldOfStudy: String(entry?.fieldOfStudy || "").trim(),
    startDate: String(entry?.startDate || "").trim(),
    endDate: current ? "" : String(entry?.endDate || "").trim(),
    current,
    grade: String(entry?.grade || "").trim().slice(0, EDUCATION_GRADE_MAX),
    activitiesAndSocieties: String(entry?.activitiesAndSocieties || "").trim().slice(0, EDUCATION_ACTIVITIES_MAX),
    description: String(entry?.description || "").trim().slice(0, EDUCATION_DESCRIPTION_MAX),
    skills: cleanSkills(entry?.skills),
    media: cleanMedia(entry?.media),
  };
}

export default function EducationRecordForm({ value, onChange, error }) {
  const { t, language } = useI18n();
  const months = getMonthOptions(language);
  const start = splitYearMonth(value.startDate);
  const end = splitYearMonth(value.endDate);
  const patch = (field, next) => onChange({ ...value, [field]: next });
  const description = value.description || "";
  const activities = value.activitiesAndSocieties || "";

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        {t("school")}
        <input
          value={value.school || ""}
          onChange={(event) => patch("school", event.target.value)}
          placeholder={t("schoolEx")}
        />
      </label>
      <label className={styles.field}>
        {t("degree")}
        <input
          value={value.degree || ""}
          onChange={(event) => patch("degree", event.target.value)}
          placeholder={t("degreeEx")}
        />
      </label>
      <label className={styles.field}>
        {t("fieldOfStudy")}
        <input
          value={value.fieldOfStudy || ""}
          onChange={(event) => patch("fieldOfStudy", event.target.value)}
          placeholder={t("fieldEx")}
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          {t("startMonth")}
          <select
            value={start.month}
            onChange={(event) => patch("startDate", joinYearMonth(start.year || String(currentYear), event.target.value))}
          >
            <option value="">{t("month")}</option>
            {months.map((month) => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          {t("startYear")}
          <select
            value={start.year}
            onChange={(event) => patch("startDate", joinYearMonth(event.target.value, start.month || "01"))}
          >
            <option value="">{t("year")}</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>

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
        {t("currentlyStudying")}
      </label>

      {value.current ? null : (
        <div className={styles.row}>
          <label className={styles.field}>
            {t("endMonth")}
            <select
              value={end.month}
              onChange={(event) => patch("endDate", joinYearMonth(end.year || String(currentYear), event.target.value))}
            >
              <option value="">{t("month")}</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            {t("endYear")}
            <select
              value={end.year}
              onChange={(event) => patch("endDate", joinYearMonth(event.target.value, end.month || "01"))}
            >
              <option value="">{t("year")}</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <label className={styles.field}>
        {t("grade")}
        <input
          value={value.grade || ""}
          maxLength={EDUCATION_GRADE_MAX}
          onChange={(event) => patch("grade", event.target.value.slice(0, EDUCATION_GRADE_MAX))}
          placeholder={t("gradeEx")}
        />
      </label>

      <label className={styles.field}>
        {t("activitiesAndSocieties")}
        <textarea
          rows={3}
          value={activities}
          maxLength={EDUCATION_ACTIVITIES_MAX}
          onChange={(event) => patch("activitiesAndSocieties", event.target.value.slice(0, EDUCATION_ACTIVITIES_MAX))}
          placeholder={t("activitiesEx")}
        />
        <span className={styles.counter}>{activities.length.toLocaleString(toIntlLocale(language))}/{EDUCATION_ACTIVITIES_MAX.toLocaleString(toIntlLocale(language))}</span>
      </label>

      <label className={styles.field}>
        {t("description")}
        <textarea
          rows={4}
          value={description}
          maxLength={EDUCATION_DESCRIPTION_MAX}
          onChange={(event) => patch("description", event.target.value.slice(0, EDUCATION_DESCRIPTION_MAX))}
          placeholder={t("educationDescEx")}
        />
        <span className={styles.counter}>{description.length.toLocaleString(toIntlLocale(language))}/{EDUCATION_DESCRIPTION_MAX.toLocaleString(toIntlLocale(language))}</span>
      </label>
      {error ? <p className={styles.error}>{tMessage(t, error)}</p> : null}
    </div>
  );
}

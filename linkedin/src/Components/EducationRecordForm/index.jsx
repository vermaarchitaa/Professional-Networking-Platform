import React from "react";
import styles from "./styles.module.css";

export const emptyEducation = {
  school: "",
  degree: "",
  fieldOfStudy: "",
  startDate: "",
  endDate: "",
  current: false,
  description: "",
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

export function isFilledEducation(entry) {
  return Boolean(
    String(entry?.school || "").trim()
    || String(entry?.degree || "").trim()
    || String(entry?.fieldOfStudy || "").trim()
  );
}

export function educationLabel(entry) {
  return [entry?.school, entry?.degree, entry?.fieldOfStudy].filter(Boolean).join(" · ") || "Education";
}

export function formatEducationDates(entry) {
  const start = formatYearMonth(entry?.startDate);
  if (entry?.current) return start ? `${start} – Present` : "Present";
  const end = formatYearMonth(entry?.endDate);
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" – ");
}

export function cleanEducation(entry) {
  const current = Boolean(entry?.current);
  return {
    school: String(entry?.school || "").trim(),
    degree: String(entry?.degree || "").trim(),
    fieldOfStudy: String(entry?.fieldOfStudy || "").trim(),
    startDate: String(entry?.startDate || "").trim(),
    endDate: current ? "" : String(entry?.endDate || "").trim(),
    current,
    description: String(entry?.description || "").trim(),
  };
}

export default function EducationRecordForm({ value, onChange, error }) {
  const start = splitYearMonth(value.startDate);
  const end = splitYearMonth(value.endDate);
  const patch = (field, next) => onChange({ ...value, [field]: next });

  return (
    <div className={styles.form}>
      <label className={styles.field}>
        School/institution*
        <input
          value={value.school || ""}
          onChange={(event) => patch("school", event.target.value)}
          placeholder="Ex: Boston University"
        />
      </label>
      <label className={styles.field}>
        Degree
        <input
          value={value.degree || ""}
          onChange={(event) => patch("degree", event.target.value)}
          placeholder="Ex: Bachelor’s"
        />
      </label>
      <label className={styles.field}>
        Field of study
        <input
          value={value.fieldOfStudy || ""}
          onChange={(event) => patch("fieldOfStudy", event.target.value)}
          placeholder="Ex: Business"
        />
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
        I am currently studying here
      </label>

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
          rows={3}
          value={value.description || ""}
          onChange={(event) => patch("description", event.target.value)}
          placeholder="Activities, societies, or details"
        />
      </label>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { CloseIcon } from "@/Components/CoverPhotoFlow/icons";
import { updateProfileData, updateUserInfo } from "@/config/redux/action/profileAction";
import { getPublicProfileHref } from "@/config/utils";
import { validateName, validateOptionalEmail } from "@/config/validation";
import styles from "./styles.module.css";

const ADDRESS_MAX = 260;
const HEADLINE_MAX = 220;
const STANDARD_PRONOUNS = new Set(["she/her", "he/him", "they/them"]);
const PRONOUN_OPTIONS = [
  { value: "", label: "Please select" },
  { value: "he/him", label: "He/Him" },
  { value: "she/her", label: "She/Her" },
  { value: "they/them", label: "They/Them" },
  { value: "custom", label: "Custom" },
];
const PHONE_TYPES = [
  { value: "", label: "Please select" },
  { value: "Mobile", label: "Mobile" },
  { value: "Home", label: "Home" },
  { value: "Work", label: "Work" },
];
const VISIBILITY_OPTIONS = [
  { value: "anyone", label: "Anyone" },
  { value: "connections", label: "Connections only" },
  { value: "only-me", label: "Only me" },
];
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

function splitName(fullName) {
  const trimmed = String(fullName || "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const [firstName, ...rest] = trimmed.split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

function joinName(firstName, lastName) {
  return [firstName, lastName].map((part) => String(part || "").trim()).filter(Boolean).join(" ");
}

function splitLocation(location) {
  const trimmed = String(location || "").trim();
  if (!trimmed) return { city: "", country: "" };
  const comma = trimmed.indexOf(",");
  if (comma === -1) return { city: trimmed, country: "" };
  return {
    city: trimmed.slice(0, comma).trim(),
    country: trimmed.slice(comma + 1).trim(),
  };
}

function joinLocation(city, country) {
  return [city, country].map((part) => String(part || "").trim()).filter(Boolean).join(", ");
}

function parseBirthday(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) return { year: "1900", month: "", day: "" };
  return { year: match[1], month: match[2], day: match[3] };
}

function formatBirthday(year, month, day) {
  if (!month || !day) return "";
  return `${year || "1900"}-${month}-${day}`;
}

function daysInMonth(month) {
  if (month === "02") return 29;
  if (["04", "06", "09", "11"].includes(month)) return 30;
  return 31;
}

function draftFromProfile(profile) {
  const user = profile?.userId || {};
  const intro = profile?.intro || {};
  const contact = profile?.contactInfo || {};
  const { firstName, lastName } = splitName(user.name);
  const fallback = splitLocation(profile?.location);
  const storedPronouns = intro.pronouns || "";
  const isCustom = storedPronouns && !STANDARD_PRONOUNS.has(storedPronouns);
  const birthday = parseBirthday(contact.birthday);
  return {
    firstName,
    lastName,
    additionalName: intro.additionalName || "",
    pronouns: isCustom ? "custom" : storedPronouns,
    customPronouns: isCustom ? storedPronouns : "",
    headline: profile?.currentPost || "",
    country: intro.country || fallback.country,
    city: intro.city || fallback.city,
    industry: intro.industry || "",
    education: intro.education || "",
    username: user.username || "",
    email: contact.email || "",
    phone: contact.phone || "",
    phoneType: contact.phoneType || "",
    address: contact.address || "",
    birthYear: birthday.year,
    birthMonth: birthday.month,
    birthDay: birthday.day,
    website: contact.website || "",
    showWebsite: Boolean(contact.website),
    instantMessaging: contact.instantMessaging || "",
    showMessaging: Boolean(contact.instantMessaging),
    emailVisibility: contact.emailVisibility || "anyone",
    phoneVisibility: contact.phoneVisibility || "anyone",
  };
}

export default function ProfileIntroFlow({ open, profile, onClose, initialView = "intro" }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const savingRef = useRef(false);
  const [view, setView] = useState("intro");
  const [draft, setDraft] = useState(() => draftFromProfile(profile));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setView("intro");
      setError("");
      setSaving(false);
      savingRef.current = false;
      return undefined;
    }
    setView(initialView === "contact" ? "contact" : "intro");
    setDraft(draftFromProfile(profile));
    setError("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, initialView]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      if (view === "contact") {
        setError("");
        setView("intro");
        return;
      }
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, view, onClose]);

  if (!open) return null;

  const dayCount = daysInMonth(draft.birthMonth || "01");
  const profileUrlHref = getPublicProfileHref(draft.username);
  const patch = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const persistExistingFields = async () => {
    if (savingRef.current) return false;
    const name = joinName(draft.firstName, draft.lastName);
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return false;
    }
    const emailError = validateOptionalEmail(draft.email);
    if (emailError) {
      setError(emailError);
      return false;
    }
    if (draft.pronouns === "custom" && !draft.customPronouns.trim()) {
      setError("Enter custom pronouns, or choose another option.");
      return false;
    }

    const pronouns = draft.pronouns === "custom" ? draft.customPronouns.trim() : draft.pronouns;
    const birthday = formatBirthday(draft.birthYear, draft.birthMonth, draft.birthDay);

    savingRef.current = true;
    setSaving(true);
    setError("");
    const userResult = await dispatch(updateUserInfo({
      name,
      username: draft.username,
      email: profile?.userId?.email,
    }));
    if (updateUserInfo.rejected.match(userResult)) {
      savingRef.current = false;
      setSaving(false);
      setError(userResult.payload?.message || "Failed to update intro");
      return false;
    }

    const profileResult = await dispatch(updateProfileData({
      currentPost: draft.headline.trim(),
      location: joinLocation(draft.city, draft.country),
      intro: {
        additionalName: draft.additionalName.trim(),
        pronouns,
        industry: draft.industry.trim(),
        city: draft.city.trim(),
        country: draft.country.trim(),
        education: draft.education.trim(),
        educationIndex: Number.isInteger(profile?.intro?.educationIndex)
          ? profile.intro.educationIndex
          : null,
      },
      contactInfo: {
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        phoneType: draft.phone.trim() ? draft.phoneType : "",
        address: draft.address.trim().slice(0, ADDRESS_MAX),
        birthday,
        website: draft.website.trim(),
        instantMessaging: draft.instantMessaging.trim(),
        emailVisibility: draft.emailVisibility,
        phoneVisibility: draft.phoneVisibility,
      },
    }));
    savingRef.current = false;
    setSaving(false);
    if (updateProfileData.rejected.match(profileResult)) {
      setError(profileResult.payload?.message || "Failed to update intro");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    const ok = await persistExistingFields();
    if (ok) onClose();
  };

  const busy = saving;

  return (
    <div className={styles.overlay} onClick={() => { if (!busy) onClose(); }} role="presentation">
      <div
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-editor-title"
      >
        {view === "intro" ? (
          <>
            <header className={styles.header}>
              <h2 id="intro-editor-title">Edit intro</h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </header>

            <div className={styles.body}>
              <p className={styles.hint}>* Indicates required</p>

              <div className={styles.row}>
                <label className={styles.field}>
                  First name*
                  <input
                    value={draft.firstName}
                    onChange={(event) => patch("firstName", event.target.value)}
                    autoComplete="given-name"
                  />
                </label>
                <label className={styles.field}>
                  Last name*
                  <input
                    value={draft.lastName}
                    onChange={(event) => patch("lastName", event.target.value)}
                    autoComplete="family-name"
                  />
                </label>
              </div>

              <label className={styles.field}>
                Additional name
                <input
                  value={draft.additionalName}
                  onChange={(event) => patch("additionalName", event.target.value)}
                />
              </label>

              <label className={styles.field}>
                Pronouns
                <select value={draft.pronouns} onChange={(event) => patch("pronouns", event.target.value)}>
                  {PRONOUN_OPTIONS.map((option) => (
                    <option key={option.value || "none"} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              {draft.pronouns === "custom" ? (
                <label className={styles.field}>
                  Custom pronouns
                  <input
                    value={draft.customPronouns}
                    onChange={(event) => patch("customPronouns", event.target.value)}
                    placeholder="e.g. Xe/Xem"
                  />
                </label>
              ) : null}

              <label className={styles.field}>
                Headline*
                <textarea
                  rows={3}
                  maxLength={HEADLINE_MAX}
                  value={draft.headline}
                  onChange={(event) => patch("headline", event.target.value.slice(0, HEADLINE_MAX))}
                  placeholder="Student at ..."
                />
                <span className={styles.counter}>{draft.headline.length}/{HEADLINE_MAX}</span>
              </label>

              <label className={styles.field}>
                Country/Region
                <input
                  value={draft.country}
                  onChange={(event) => patch("country", event.target.value)}
                  placeholder="India"
                />
              </label>

              <label className={styles.field}>
                City
                <input
                  value={draft.city}
                  onChange={(event) => patch("city", event.target.value)}
                  placeholder="Ghaziabad"
                />
              </label>

              <label className={styles.field}>
                Education
                <input
                  value={draft.education}
                  onChange={(event) => patch("education", event.target.value)}
                  placeholder="Ex: KIET Group of Institutions"
                />
              </label>

              <label className={styles.field}>
                Industry
                <input
                  value={draft.industry}
                  onChange={(event) => patch("industry", event.target.value)}
                  placeholder="Higher Education"
                />
              </label>

              <div className={styles.contactCard}>
                <div>
                  <p className={styles.contactTitle}>Contact info</p>
                  <p className={styles.contactMeta}>
                    {[draft.email, draft.username ? `/in/${draft.username}` : ""].filter(Boolean).join(" · ") || "Add contact info"}
                  </p>
                </div>
                <button type="button" className={styles.linkBtn} onClick={() => { setError(""); setView("contact"); }}>
                  Edit contact info
                </button>
              </div>

              {error ? <p className={styles.error}>{error}</p> : null}
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy} aria-busy={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        ) : (
          <>
            <header className={styles.header}>
              <button type="button" className={styles.backBtn} onClick={() => { setError(""); setView("intro"); }}>
                ← Back
              </button>
              <h2 id="intro-editor-title">Edit contact info</h2>
              <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close">
                <CloseIcon />
              </button>
            </header>

            <div className={styles.body}>
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Profile URL</h3>
                {profileUrlHref ? (
                  <button
                    type="button"
                    className={styles.profileUrlBtn}
                    onClick={() => {
                      onClose();
                      router.push("/profile/url");
                    }}
                  >
                    <span>{profileUrlHref}</span>
                    <span className={styles.externalIcon} aria-hidden="true">↗</span>
                  </button>
                ) : (
                  <button type="button" className={styles.addBtn} onClick={() => { onClose(); router.push("/profile/url"); }}>
                    + Set profile URL
                  </button>
                )}
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Email</h3>
                <label className={styles.field}>
                  <input
                    type="email"
                    value={draft.email}
                    onChange={(event) => patch("email", event.target.value)}
                    placeholder="Add a contact email"
                    autoComplete="off"
                  />
                </label>
                <label className={styles.field}>
                  Visible to
                  <select value={draft.emailVisibility} onChange={(event) => patch("emailVisibility", event.target.value)}>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Phone</h3>
                <div className={styles.row}>
                  <label className={styles.field}>
                    Phone number
                    <input
                      value={draft.phone}
                      onChange={(event) => patch("phone", event.target.value)}
                      autoComplete="tel"
                    />
                  </label>
                  <label className={styles.field}>
                    Phone type
                    <select value={draft.phoneType} onChange={(event) => patch("phoneType", event.target.value)}>
                      {PHONE_TYPES.map((option) => (
                        <option key={option.value || "none"} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className={styles.field}>
                  Visible to
                  <select value={draft.phoneVisibility} onChange={(event) => patch("phoneVisibility", event.target.value)}>
                    {VISIBILITY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Address</h3>
                <label className={styles.field}>
                  <textarea
                    rows={3}
                    maxLength={ADDRESS_MAX}
                    value={draft.address}
                    onChange={(event) => patch("address", event.target.value.slice(0, ADDRESS_MAX))}
                  />
                  <span className={styles.counter}>{draft.address.length}/{ADDRESS_MAX}</span>
                </label>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Birthday</h3>
                <div className={styles.row}>
                  <label className={styles.field}>
                    Month
                    <select
                      value={draft.birthMonth}
                      onChange={(event) => {
                        const month = event.target.value;
                        setDraft((current) => {
                          const max = daysInMonth(month || "01");
                          const dayNum = Number(current.birthDay);
                          return {
                            ...current,
                            birthMonth: month,
                            birthDay: current.birthDay && dayNum > max
                              ? String(max).padStart(2, "0")
                              : current.birthDay,
                          };
                        });
                        setError("");
                      }}
                    >
                      <option value="">Month</option>
                      {MONTHS.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field}>
                    Day
                    <select value={draft.birthDay} onChange={(event) => patch("birthDay", event.target.value)}>
                      <option value="">Day</option>
                      {Array.from({ length: dayCount }, (_, index) => {
                        const day = String(index + 1).padStart(2, "0");
                        return <option key={day} value={day}>{index + 1}</option>;
                      })}
                    </select>
                  </label>
                </div>
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Website</h3>
                {draft.showWebsite ? (
                  <label className={styles.field}>
                    <input
                      value={draft.website}
                      onChange={(event) => patch("website", event.target.value)}
                      placeholder="https://"
                    />
                  </label>
                ) : (
                  <button type="button" className={styles.addBtn} onClick={() => patch("showWebsite", true)}>
                    + Add website
                  </button>
                )}
              </section>

              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Instant messaging</h3>
                {draft.showMessaging ? (
                  <label className={styles.field}>
                    <input
                      value={draft.instantMessaging}
                      onChange={(event) => patch("instantMessaging", event.target.value)}
                      placeholder="Skype, WeChat, etc."
                    />
                  </label>
                ) : (
                  <button type="button" className={styles.addBtn} onClick={() => patch("showMessaging", true)}>
                    + Add instant messaging
                  </button>
                )}
              </section>

              {error ? <p className={styles.error}>{error}</p> : null}
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.saveBtn} onClick={handleSave} disabled={busy} aria-busy={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

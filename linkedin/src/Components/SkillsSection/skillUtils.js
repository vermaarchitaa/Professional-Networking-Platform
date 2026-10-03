export const SKILL_NAME_MAX = 80;

const TOOLS_SKILLS = new Set([
  "html", "html5", "css", "cascading style sheets", "cascading style sheets (css)",
  "javascript", "typescript", "react", "react.js", "reactjs", "next.js", "nextjs",
  "node.js", "nodejs", "express", "express.js", "mongodb", "sql", "mysql", "postgresql",
  "python", "java", "c", "c++", "c#", "go", "golang", "php", "ruby", "kotlin", "swift",
  "git", "github", "docker", "kubernetes", "linux", "aws", "azure", "redux",
  "tailwind css", "tailwind", "figma", "excel", "microsoft excel", "microsoft office",
  "powerpoint", "wordpress", "django", "flask", "spring", "android", "ios",
]);

const DEFAULT_SUGGESTIONS = [
  "Project Management",
  "Communication",
  "Leadership",
  "Teamwork",
  "Problem Solving",
  "Microsoft Office",
  "Cascading Style Sheets (CSS)",
  "HTML5",
  "JavaScript",
  "React",
  "Python",
  "SQL",
];

export function normalizeSkillName(value) {
  return String(value || "").trim().slice(0, SKILL_NAME_MAX);
}

export function skillKey(value) {
  return normalizeSkillName(value).toLowerCase();
}

export function inferSkillCategory(name) {
  return TOOLS_SKILLS.has(skillKey(name)) ? "tools" : "";
}

export function listProfileSkills(profile) {
  return (profile?.skills || []).filter((item) => normalizeSkillName(item?.name));
}

export function getAssociableRecords(profile) {
  const education = (profile?.education || [])
    .filter((entry) => String(entry?.school || "").trim())
    .map((entry) => ({
      kind: "education",
      refId: String(entry._id || ""),
      label: String(entry.school).trim(),
    }))
    .filter((item) => item.refId);
  const experience = (profile?.pastWork || [])
    .filter((entry) => String(entry?.company || entry?.position || "").trim())
    .map((entry) => ({
      kind: "experience",
      refId: String(entry._id || ""),
      label: String(entry.company || entry.position).trim(),
    }))
    .filter((item) => item.refId);
  return { education, experience };
}

export function resolveSkillAssociations(skill, profile) {
  const records = getAssociableRecords(profile);
  const all = [...records.education, ...records.experience];
  return (skill?.associations || [])
    .map((item) => all.find((record) => record.kind === item.kind && record.refId === String(item.refId)))
    .filter(Boolean);
}

export function getSkillSuggestions(profile, existingNames = [], query = "") {
  const existing = new Set((existingNames || []).map(skillKey).filter(Boolean));
  const fromEducation = (profile?.education || []).flatMap((entry) => (
    (entry.skills || []).map((item) => item?.name)
  ));
  const fromHeadline = String(profile?.currentPost || "")
    .split(/[,|/·•-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length <= SKILL_NAME_MAX);
  const seen = new Set();
  const next = [];
  [...fromEducation, ...fromHeadline, ...DEFAULT_SUGGESTIONS].forEach((name) => {
    const cleaned = normalizeSkillName(name);
    const key = skillKey(cleaned);
    if (!cleaned || existing.has(key) || seen.has(key)) return;
    seen.add(key);
    next.push(cleaned);
  });
  const needle = skillKey(query);
  return needle ? next.filter((name) => skillKey(name).includes(needle)) : next.slice(0, 8);
}

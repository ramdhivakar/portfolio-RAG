export type PortfolioSkill = { name: string; category?: string };
export type PortfolioProject = { name: string; tag: string; description: string; tech: string; url?: string };
export type PortfolioCareer = { company: string; role: string; period: string; detail: string; current: boolean };

export type PortfolioData = {
  name: string;
  summary: string;
  jobTitle: string;
  company: string;
  location: string;
  email: string;
  linkedin: string;
  github: string;
  resumeUrl: string;
  skills: PortfolioSkill[];
  projects: PortfolioProject[];
  career: PortfolioCareer[];
  education: string[];
  certifications: string[];
};

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const asText = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return "";
};

const pickText = (record: UnknownRecord, keys: string[], fallback = "") => {
  for (const key of keys) {
    const value = asText(record[key]);
    if (value) return value;
  }
  return fallback;
};

const pickRecord = (root: UnknownRecord, keys: string[]): UnknownRecord => {
  for (const key of keys) if (isRecord(root[key])) return root[key] as UnknownRecord;
  return {};
};

const pickArray = (root: UnknownRecord, keys: string[]): unknown[] => {
  for (const key of keys) if (Array.isArray(root[key])) return root[key] as unknown[];
  return [];
};

const humanize = (value: string) => value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function flattenSkillValues(value: unknown, category = ""): PortfolioSkill[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => {
      if (typeof item === "string" || typeof item === "number") return [{ name: String(item), category }];
      if (isRecord(item)) {
        const name = pickText(item, ["name", "skill", "title", "technology", "label"]);
        if (name) return [{ name, category: pickText(item, ["category", "group"], category) }];
        return Object.entries(item).flatMap(([key, nested]) => flattenSkillValues(nested, humanize(key)));
      }
      return [];
    });
  }
  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, nested]) => {
      const section = humanize(key);
      if (Array.isArray(nested) || isRecord(nested)) return flattenSkillValues(nested, section);
      if (typeof nested === "string" && nested.trim()) return nested.split(/[,;|]/).map((part) => part.trim()).filter(Boolean).map((name) => ({ name, category: section }));
      return [];
    });
  }
  if (typeof value === "string" && value.trim()) {
    return value.split(/[,;|]/).map((part) => part.trim()).filter(Boolean).map((name) => ({ name, category }));
  }
  return [];
}

export function normalizePortfolio(input: unknown): PortfolioData {
  const root = isRecord(input) ? input : {};
  // Support either the complete knowledge JSON or a { knowledge: ... } wrapper.
  const data = isRecord(root.knowledge) ? root.knowledge as UnknownRecord : root;
  const profile = pickRecord(data, ["profile", "personal_profile", "personal"]);
  const currentRole = pickRecord(profile, ["current_role", "currentRole", "current_position"]);
  const contact = pickRecord(profile, ["contact", "links", "social"]);
  const summary = pickText(profile, ["professional_summary", "summary", "bio", "about"], "Professional profile details will appear here when added to the knowledge base.");

  const rawCareer = pickArray(data, ["career_history", "experience", "work_experience", "employment_history"]);
  const career: PortfolioCareer[] = rawCareer.filter(isRecord).map((item) => {
    const start = pickText(item, ["start_date", "from", "start"]);
    const end = pickText(item, ["end_date", "to", "end"]);
    const period = pickText(item, ["period", "duration"], [start, end].filter(Boolean).join(" — ") || (item.current === true ? "Present" : "Dates not provided"));
    return {
      company: pickText(item, ["company", "employer", "organization"], "Company not specified"),
      role: pickText(item, ["job_title", "role", "title", "position"], "Role not specified"),
      period,
      detail: pickText(item, ["description", "summary", "responsibilities", "details"], "Additional role details are not available in the current knowledge base."),
      current: item.current === true || /present|current/i.test(end) || pickText(item, ["status"]).toLowerCase() === "current",
    };
  });

  const skillSource = pickRecord(data, ["skills", "technical_skills", "skill_set"]);
  const skillValue: unknown = Object.keys(skillSource).length ? skillSource : data.skills ?? data.technical_skills ?? [];
  const skills = flattenSkillValues(skillValue).filter((item, index, all) => item.name && all.findIndex((other) => other.name.toLowerCase() === item.name.toLowerCase()) === index);

  const rawProjects = pickArray(data, ["projects", "portfolio_projects", "personal_projects"]);
  const projects: PortfolioProject[] = rawProjects.filter(isRecord).map((item) => ({
    name: pickText(item, ["name", "title", "project_name"], "Project"),
    tag: pickText(item, ["tag", "category", "type"], "Selected project"),
    description: pickText(item, ["description", "summary", "purpose", "overview"], "Project details are not available in the current knowledge base."),
    tech: (() => {
      const value = item.technologies ?? item.tech_stack ?? item.tech ?? item.stack;
      return Array.isArray(value) ? value.map(asText).filter(Boolean).join(" · ") : asText(value) || "Technologies not specified";
    })(),
    url: pickText(item, ["url", "link", "repository", "github"]),
  }));

  const education = pickArray(data, ["education", "qualifications"]).map((item) => {
    if (typeof item === "string") return item;
    if (!isRecord(item)) return "";
    return [pickText(item, ["degree", "qualification", "title", "course"]), pickText(item, ["institution", "school", "university"]), pickText(item, ["year", "graduation_year"])].filter(Boolean).join(" · ");
  }).filter(Boolean);

  const certifications = pickArray(data, ["certifications", "certificates"]).map((item) => typeof item === "string" ? item : isRecord(item) ? pickText(item, ["name", "title", "certification"]) : "").filter(Boolean);

  return {
    name: pickText(profile, ["name", "full_name"], "Ramdhivakar"),
    summary,
    jobTitle: pickText(currentRole, ["job_title", "title", "role"], "Professional role not specified"),
    company: pickText(currentRole, ["company", "employer", "organization"], "Company not specified"),
    location: pickText(profile, ["location", "city", "based_in"], ""),
    email: pickText(contact, ["email"], pickText(profile, ["email", "contact_email"], "")),
    linkedin: pickText(contact, ["linkedin", "linkedin_url"], pickText(profile, ["linkedin", "linkedin_url"], "")),
    github: pickText(contact, ["github", "github_url"], pickText(profile, ["github", "github_url"], "")),
    resumeUrl: pickText(contact, ["resume", "resume_url", "cv"], pickText(profile, ["resume_url"], "")),
    skills,
    projects,
    career,
    education,
    certifications,
  };
}

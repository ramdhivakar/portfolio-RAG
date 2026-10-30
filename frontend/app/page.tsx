"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownToLine, ArrowRight, ArrowUpRight, Bot, BriefcaseBusiness,
  CalendarDays, Code2, Command, Github, Home, Laptop, Linkedin, Mail,
  Menu, MessageCircle, Send, ShieldCheck, Sparkles, UserRound, X,
} from "lucide-react";
import { normalizePortfolio, type PortfolioData } from "@/lib/portfolio";

type ChatMessage = { role: "assistant" | "user"; content: string };

const navigation = [
  { label: "Home", icon: Home },
  { label: "Experience", icon: BriefcaseBusiness },
  { label: "Skills", icon: Code2 },
  { label: "Projects", icon: Command },
  { label: "Contact", icon: Mail },
];

const starterPrompts = [
  "What is Ramdhivakar's current role?",
  "What IAM technologies are in his profile?",
  "Walk me through his projects",
  "Summarize his career experience",
];

const emptyPortfolio: PortfolioData = {
  name: "Ramdhivakar", summary: "Loading approved profile information from the knowledge base…",
  jobTitle: "Loading role…", company: "", location: "", email: "", linkedin: "", github: "", resumeUrl: "",
  skills: [], projects: [], career: [], education: [], certifications: [],
};

export default function HomePage() {
  const [activeNav, setActiveNav] = useState("Home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioData>(emptyPortfolio);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm Ramdhivakar's portfolio assistant. Ask me about his experience, skills, projects, or professional interests. I'll answer using the connected portfolio knowledge base." },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    return hour < 12 ? "Good morning." : hour < 18 ? "Good afternoon." : "Good evening.";
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load the portfolio knowledge base.");
        if (active) {
          setPortfolio(normalizePortfolio(payload));
          setProfileError("");
        }
      } catch (error) {
        if (active) setProfileError(error instanceof Error ? error.message : "Unable to load the portfolio knowledge base.");
      } finally {
        if (active) setProfileLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, []);

  function goTo(label: string) {
    setActiveNav(label);
    setMobileNavOpen(false);
    if (label === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
    else document.getElementById(label.toLowerCase())?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function sendMessage(value = input) {
    const question = value.trim();
    if (!question || busy) return;
    setMessages((old) => [...old, { role: "user", content: question }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question }),
      });
      const data = (await response.json().catch(() => ({}))) as { answer?: string; error?: string; detail?: string };
      if (!response.ok) throw new Error(data.error || data.detail || `Request failed (${response.status}).`);
      if (!data.answer) throw new Error("The backend returned an empty answer.");
      setMessages((old) => [...old, { role: "assistant", content: data.answer! }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to contact the AI backend.";
      setMessages((old) => [...old, { role: "assistant", content: `I couldn't get an answer from the portfolio backend. ${message}` }]);
    } finally {
      setBusy(false);
      window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  const projectIcons = [MessageCircle, Sparkles, Laptop, Code2];
  const projectTones = ["red", "cream", "blue", "green"];

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark">R<span>.</span></div>
          <div className="brand-name">ramdhivakar<span className="brand-dot">.</span></div>
          <button className="icon-button mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="nav-list" aria-label="Portfolio navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${activeNav === label ? "nav-active" : ""}`} onClick={() => goTo(label)}>
              <Icon size={17} strokeWidth={1.8} /><span>{label}</span>{activeNav === label && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="availability"><span className="status-dot" /> Portfolio knowledge connected</div>
          <div className="sidebar-mini-card">
            <div className="mini-icon"><Bot size={17} /></div>
            <p className="mini-title">Know my work?</p>
            <p className="mini-copy">Ask the AI assistant about the approved information in my professional profile.</p>
            <button className="mini-link" onClick={() => document.getElementById("chat-input")?.focus()}>Start a conversation <ArrowRight size={14} /></button>
          </div>
          <div className="sidebar-footer"><span>© {new Date().getFullYear()} {portfolio.name}</span><span className="footer-dot" /><span>Built with intent</span></div>
        </div>
      </aside>

      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <section className="main-panel" id="home">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumb"><span>Portfolio</span><span className="crumb-slash">/</span><strong>{activeNav}</strong></div>
          <div className="topbar-right"><span className="live-pill"><span className="status-dot" /> Knowledge-base driven</span><span className="topbar-divider" /><span className="timezone">API · CONNECTED</span></div>
        </header>

        <div className="main-scroll">
          <section className="hero-section">
            <div className="hero-copy">
              <div className="eyebrow"><span className="eyebrow-line" /> TECHNICAL PROFESSIONAL <span className="eyebrow-index">/ 001</span></div>
              <p className="greeting">{greeting} I&apos;m</p>
              <h1>{portfolio.name}<span className="hero-period">.</span></h1>
              <h2>{portfolio.jobTitle}{portfolio.company ? <><span className="role-slash"> / </span>{portfolio.company}</> : null}</h2>
              <p className="hero-summary">{portfolio.summary}</p>
              <div className="hero-actions">
                <button className="button button-light" onClick={() => goTo("Contact")}>Let&apos;s connect <ArrowUpRight size={16} /></button>
                {portfolio.resumeUrl ? <a className="button button-outline" href={portfolio.resumeUrl} target="_blank" rel="noreferrer"><ArrowDownToLine size={16} /> View resume</a> : <span className="button button-outline button-disabled" aria-disabled="true"><ArrowDownToLine size={16} /> Resume not added</span>}
              </div>
              <div className="hero-socials">
                {portfolio.linkedin && <a href={portfolio.linkedin} target="_blank" rel="noreferrer"><Linkedin size={15} /> LinkedIn <ArrowUpRight size={12} /></a>}
                {portfolio.github && <a href={portfolio.github} target="_blank" rel="noreferrer"><Github size={15} /> GitHub <ArrowUpRight size={12} /></a>}
                {portfolio.email && <a href={`mailto:${portfolio.email}`}><Mail size={15} /> Email <ArrowUpRight size={12} /></a>}
              </div>
              {profileError && <p className="api-status api-status-error"><ShieldCheck size={13} /> Profile API: {profileError}</p>}
              {profileLoading && <p className="api-status"><span className="status-dot" /> Loading profile from backend knowledge base…</p>}
            </div>
            <div className="portrait-area">
              <div className="portrait-orbit orbit-one" /><div className="portrait-orbit orbit-two" /><div className="portrait-glow" />
              <div className="portrait-placeholder"><UserRound size={74} strokeWidth={1.1} /><span>PROFILE PORTRAIT</span><small>Add a photo when ready</small></div>
              <div className="portrait-caption"><span>01 / PROFILE</span><span>{portfolio.location || "LOCATION NOT PROVIDED"}</span></div>
              <div className="portrait-note"><span className="note-line" /> Curious by nature. Technical by craft.</div>
            </div>
            <div className="hero-index">01 <span>—</span> 05</div>
          </section>

          <section className="metrics-row" aria-label="Profile highlights">
            <div className="metric"><span className="metric-label">CAREER HISTORY</span><strong>{String(portfolio.career.length).padStart(2, "0")}</strong><span className="metric-foot">Roles in the knowledge base</span></div>
            <div className="metric"><span className="metric-label">SKILLS</span><strong>{String(portfolio.skills.length).padStart(2, "0")}</strong><span className="metric-foot">Listed technical capabilities</span></div>
            <div className="metric"><span className="metric-label">PROJECTS</span><strong>{String(portfolio.projects.length).padStart(2, "0")}</strong><span className="metric-foot">Projects in the knowledge base</span></div>
            <div className="metric"><span className="metric-label">MINDSET</span><strong className="metric-word">Always<span> learning</span></strong><span className="metric-foot">Build · Learn · Improve</span></div>
          </section>

          <section className="content-section" id="skills">
            <div className="section-heading"><div><span className="section-kicker">CAPABILITIES / 02</span><h3>What I work with<span>.</span></h3></div><span className="section-aside">Skills loaded from the professional knowledge base.</span></div>
            {portfolio.skills.length ? <div className="skill-cloud">{portfolio.skills.map((skill, index) => <span className={`skill-chip ${index < 4 ? "skill-chip-featured" : ""}`} key={`${skill.name}-${index}`}>{index < 4 && <span className="chip-dot" />}{skill.name}</span>)}</div> : <p className="empty-state">{profileLoading ? "Loading skills…" : "No skills are listed in the current knowledge base yet."}</p>}
          </section>

          <section className="content-section" id="projects">
            <div className="section-heading"><div><span className="section-kicker">SELECTED WORK / 03</span><h3>Things I&apos;ve built<span>.</span></h3></div><span className="section-aside">Project content is read from the backend.</span></div>
            {portfolio.projects.length ? <div className="project-grid">{portfolio.projects.map((project, index) => {
              const Icon = projectIcons[index % projectIcons.length];
              return <article className="project-card" key={`${project.name}-${index}`}>
                <div className="project-card-top"><span className={`project-icon ${projectTones[index % projectTones.length]}`}><Icon size={18} /></span><span className="project-number">{String(index + 1).padStart(2, "0")}</span></div>
                <span className="project-tag">{project.tag}</span><h4>{project.name}</h4><p>{project.description}</p>
                <div className="project-card-foot"><span>{project.tech}</span>{project.url ? <a href={project.url} target="_blank" rel="noreferrer" aria-label={`Open ${project.name}`}><ArrowUpRight size={15} /></a> : <ArrowUpRight size={15} />}</div>
              </article>;
            })}</div> : <p className="empty-state">{profileLoading ? "Loading projects…" : "No projects are listed in the current knowledge base yet."}</p>}
          </section>

          <section className="content-section experience-section" id="experience">
            <div className="section-heading"><div><span className="section-kicker">CAREER / 04</span><h3>The path so far<span>.</span></h3></div><span className="section-aside">Employment history from the knowledge base.</span></div>
            {portfolio.career.length ? <div className="timeline">{portfolio.career.map((item, index) => <article className="timeline-item" key={`${item.company}-${item.role}-${index}`}>
              <span className={`timeline-marker ${item.current ? "timeline-marker-active" : ""}`} />
              <div className="timeline-main"><div className="timeline-title-row"><h4>{item.role}</h4>{item.current && <span className="current-badge"><span className="status-dot" /> CURRENT</span>}</div><p className="timeline-company">{item.company}</p><p className="timeline-detail">{item.detail}</p></div>
              <span className="timeline-period"><CalendarDays size={13} /> {item.period}</span>
            </article>)}</div> : <p className="empty-state">{profileLoading ? "Loading experience…" : "No career history is listed in the current knowledge base yet."}</p>}
            {(portfolio.education.length > 0 || portfolio.certifications.length > 0) && <div className="credentials-grid">
              {portfolio.education.length > 0 && <div><span className="section-kicker">EDUCATION</span>{portfolio.education.map((item) => <p className="credential-item" key={item}>{item}</p>)}</div>}
              {portfolio.certifications.length > 0 && <div><span className="section-kicker">CERTIFICATIONS</span>{portfolio.certifications.map((item) => <p className="credential-item" key={item}>{item}</p>)}</div>}
            </div>}
          </section>

          <section className="contact-section" id="contact">
            <div><span className="section-kicker">NEXT CHAPTER / 05</span><h3>Have something interesting<br />in mind<span>?</span></h3><p>Let&apos;s talk about technical challenges, security, or building something useful.</p></div>
            {portfolio.email ? <a className="button button-light" href={`mailto:${portfolio.email}`}>Start a conversation <ArrowUpRight size={16} /></a> : <span className="button button-outline button-disabled">Contact details not added</span>}
          </section>
          <footer className="main-footer"><span>DESIGNED TO STAY CURIOUS.</span><span>BLACK / WHITE / PURPOSE.</span></footer>
        </div>
      </section>

      <aside className="assistant-panel" aria-label="AI portfolio assistant">
        <div className="assistant-header">
          <div className="assistant-avatar"><Bot size={18} /></div>
          <div className="assistant-heading"><div className="assistant-title">Ask {portfolio.name}<span className="assistant-spark">✳</span></div><div className="assistant-subtitle"><span className="status-dot" /> Portfolio AI <span className="header-separator">·</span> Knowledge-base mode</div></div>
          <button className="icon-button clear-chat" title="Reset conversation" onClick={() => setMessages([{ role: "assistant", content: `Hi! I'm ${portfolio.name}'s portfolio assistant. Ask me about his experience, skills, projects, or professional interests. I'll answer using the connected portfolio knowledge base.` }])}><Sparkles size={16} /></button>
        </div>
        <div className="chat-context"><ShieldCheck size={14} /><span>Answers are generated by the FastAPI backend using retrieved portfolio evidence.</span></div>
        <div className="chat-messages" aria-live="polite">
          <div className="date-divider"><span /> CONVERSATION <span /></div>
          {messages.map((message, index) => <div className={`message-row message-${message.role}`} key={`${message.role}-${index}`}>
            {message.role === "assistant" && <div className="message-avatar"><span>R.</span></div>}
            <div className="message-content">{message.role === "assistant" && <div className="message-author">Ramdhivakar AI <span>·</span> <span className="message-time">portfolio assistant</span></div>}<div className="message-bubble">{message.content}</div></div>
            {message.role === "user" && <div className="user-avatar">YOU</div>}
          </div>)}
          {busy && <div className="message-row message-assistant"><div className="message-avatar"><span>R.</span></div><div className="message-content"><div className="message-author">Ramdhivakar AI</div><div className="message-bubble typing"><i /><i /><i /></div></div></div>}
          <div ref={chatEndRef} />
        </div>
        {messages.length < 3 && <div className="suggestions"><span className="suggestions-label">START WITH A QUESTION</span>{starterPrompts.map((prompt, index) => <button key={prompt} className="suggestion-chip" onClick={() => void sendMessage(prompt)}><span className="suggestion-index">0{index + 1}</span>{prompt}<ArrowUpRight size={13} /></button>)}</div>}
        <div className="assistant-bottom">
          <form className="chat-composer" onSubmit={onSubmit}>
            <textarea id="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about my experience, skills…" rows={1} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} />
            <div className="composer-bottom"><span><span className="composer-dot" /> Connected to FastAPI + Groq</span><button type="submit" className="send-button" disabled={!input.trim() || busy} aria-label="Send message"><Send size={15} /></button></div>
          </form>
          <p className="ai-disclaimer"><Sparkles size={11} /> Profile responses use the connected backend</p>
        </div>
      </aside>
    </main>
  );
}

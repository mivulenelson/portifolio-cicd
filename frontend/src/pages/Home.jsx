import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { ThemeToggle } from "../theme.jsx";

function Header({ name }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  return (
    <header className="site-header">
      <div className="wrap header-inner">
        <a href="#top" className="brand">
          <span className="brand-full">{name}</span>
          <span className="brand-short" aria-hidden="true">{initials}</span>
        </a>
        <nav aria-label="Sections" className="nav">
          <a href="#projects">Projects</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

function Hero({ profile }) {
  const [first, ...rest] = profile.name.split(" ");
  return (
    <section className="hero wrap" id="top">
      <h1 className="hero-name" aria-label={profile.name}>
        <span className="line" aria-hidden="true"><span>{first}</span></span>
        {rest.length > 0 && (
          <span className="line" aria-hidden="true"><span>{rest.join(" ")}</span></span>
        )}
      </h1>
      <p className="hero-headline">{profile.headline}</p>
      {profile.availability && (
        <p className="status"><span className="status-dot" aria-hidden="true" />{profile.availability}</p>
      )}
      {profile.bio && <p className="hero-bio">{profile.bio}</p>}
      <div className="actions">
        <a className="btn btn-primary" href="#projects">View projects</a>
        <a className="btn btn-ghost" href="#contact">Get in touch</a>
        {profile.resume_url && (
          <a className="btn btn-ghost" href={profile.resume_url} target="_blank" rel="noopener noreferrer">Download résumé</a>
        )}
      </div>
    </section>
  );
}

function Projects({ projects }) {
  return (
    <section className="section wrap" id="projects">
      <h2>Projects</h2>
      {projects.length === 0 ? (
        <p className="muted">Projects will appear here soon.</p>
      ) : (
        <div className="projects">
          {projects.map((p) => (
            <article className="project" key={p.id}>
              <div className="project-head">
                <h3>{p.title}</h3>
                <div className="project-links">
                  {p.repo_url && <a href={p.repo_url} target="_blank" rel="noopener noreferrer">Source code</a>}
                  {p.live_url && <a href={p.live_url} target="_blank" rel="noopener noreferrer">Live demo</a>}
                </div>
              </div>
              <div className="project-body">
                <p>{p.description}</p>
                {p.tech.length > 0 && (
                  <ul className="tags" aria-label="Technologies used">
                    {p.tech.map((t) => <li key={t}>{t}</li>)}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Skills({ skills }) {
  const groups = skills.reduce((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});
  return (
    <section className="section wrap" id="skills">
      <h2>Skills</h2>
      {skills.length === 0 ? (
        <p className="muted">Skills will appear here soon.</p>
      ) : (
        <div className="skill-groups">
          {Object.entries(groups).map(([category, items]) => (
            <div key={category}>
              <h3 className="group-title">{category}</h3>
              <ul className="skill-list">
                {items.map((s) => (
                  <li key={s.id}>
                    <span>{s.name}</span>
                    <span className="dots" role="img" aria-label={`Proficiency ${s.level} of 5`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <i key={n} className={n <= s.level ? "on" : ""} />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [state, setState] = useState({ status: "idle", error: "" });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setState({ status: "sending", error: "" });
    try {
      await api.contact(form);
      setForm({ name: "", email: "", message: "" });
      setState({ status: "sent", error: "" });
    } catch (err) {
      setState({ status: "error", error: err.message });
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        Your name
        <input required maxLength={100} value={form.name} onChange={set("name")} autoComplete="name" />
      </label>
      <label>
        Your email
        <input required type="email" maxLength={200} value={form.email} onChange={set("email")} autoComplete="email" />
      </label>
      <label>
        Message
        <textarea required minLength={5} maxLength={3000} rows={5} value={form.message} onChange={set("message")} />
      </label>
      <button className="btn btn-primary" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Sending..." : "Send message"}
      </button>
      <p role="status" className={state.status === "error" ? "msg error" : "msg ok"}>
        {state.status === "sent" && "Message sent. Thanks for reaching out."}
        {state.status === "error" && state.error}
      </p>
    </form>
  );
}

function Contact({ profile }) {
  return (
    <section className="section wrap" id="contact">
      <h2>Contact</h2>
      <div className="contact">
        <div className="contact-info">
          <p className="lead">
            Have a role, project or question? Send a message or reach out directly.
          </p>
          {profile.email && (
            <a className="big-link" href={`mailto:${profile.email}`}>{profile.email}</a>
          )}
          <ul className="contact-links">
            {profile.github && <li><a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub</a></li>}
            {profile.linkedin && <li><a href={profile.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>}
            {profile.location && <li className="muted">{profile.location}</li>}
          </ul>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.portfolio().then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (data) document.title = `${data.profile.name} | ${data.profile.headline || "Portfolio"}`;
  }, [data]);

  if (error) {
    return (
      <main className="state-screen">
        <p>The portfolio could not be loaded. Refresh the page to try again.</p>
        <p className="muted">{error}</p>
      </main>
    );
  }
  if (!data) return <main className="state-screen"><p className="muted">Loading...</p></main>;

  return (
    <>
      <Header name={data.profile.name} />
      <main>
        <Hero profile={data.profile} />
        <Projects projects={data.projects} />
        <Skills skills={data.skills} />
        <Contact profile={data.profile} />
      </main>
      <footer className="site-footer">
        <div className="wrap footer-inner">
          <span>&copy; {new Date().getFullYear()} {data.profile.name}</span>
          <span className="muted" id="build-id">Build {import.meta.env.VITE_APP_VERSION || "dev"}</span>
          <Link to="/admin">Admin</Link>
        </div>
      </footer>
    </>
  );
}

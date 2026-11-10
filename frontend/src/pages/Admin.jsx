import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { admin, api, getToken, setToken } from "../api";
import { ThemeToggle } from "../theme.jsx";

/* ---------- small shared pieces ---------- */
function Field({ label, value, onChange, textarea, ...rest }) {
  const Tag = textarea ? "textarea" : "input";
  return (
    <label>
      {label}
      <Tag value={value} onChange={(e) => onChange(e.target.value)} rows={textarea ? 4 : undefined} {...rest} />
    </label>
  );
}

function Notice({ note }) {
  if (!note) return null;
  return <p role="status" className={note.type === "error" ? "msg error" : "msg ok"}>{note.text}</p>;
}

/* ---------- login ---------- */
function Login({ onSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await api.login(form);
      setToken(token);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-center">
      <form className="panel form login" onSubmit={submit}>
        <h1 className="admin-title">Admin sign in</h1>
        <Field label="Username" value={form.username} autoComplete="username" required
          onChange={(v) => setForm({ ...form, username: v })} />
        <Field label="Password" type="password" value={form.password} autoComplete="current-password" required
          onChange={(v) => setForm({ ...form, password: v })} />
        <button className="btn btn-primary" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        <Notice note={error && { type: "error", text: error }} />
        <Link to="/" className="muted back">Back to portfolio</Link>
      </form>
    </main>
  );
}

/* ---------- profile ---------- */
const PROFILE_FIELDS = [
  ["name", "Full name"],
  ["headline", "Headline"],
  ["availability", "Availability note"],
  ["email", "Public email"],
  ["location", "Location"],
  ["github", "GitHub URL"],
  ["linkedin", "LinkedIn URL"],
  ["resume_url", "Résumé link (optional)"],
];

function ProfileEditor() {
  const [form, setForm] = useState(null);
  const [note, setNote] = useState(null);

  useEffect(() => {
    api.portfolio().then((d) => setForm(d.profile)).catch((e) => setNote({ type: "error", text: e.message }));
  }, []);

  async function save(e) {
    e.preventDefault();
    try {
      const saved = await admin.put("/profile", form);
      setForm(saved);
      setNote({ type: "ok", text: "Profile saved." });
    } catch (err) {
      setNote({ type: "error", text: err.message });
    }
  }

  if (!form) return <p className="muted">Loading...</p>;
  return (
    <form className="panel form" onSubmit={save}>
      <div className="grid-2">
        {PROFILE_FIELDS.map(([key, label]) => (
          <Field key={key} label={label} value={form[key] || ""} onChange={(v) => setForm({ ...form, [key]: v })} />
        ))}
      </div>
      <Field label="About you" textarea value={form.bio || ""} onChange={(v) => setForm({ ...form, bio: v })} />
      <div className="row">
        <button className="btn btn-primary">Save profile</button>
        <Notice note={note} />
      </div>
    </form>
  );
}

/* ---------- projects ---------- */
const EMPTY_PROJECT = { title: "", description: "", tech: "", repo_url: "", live_url: "" };

function ProjectsManager() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); // null | { id?, ...form }
  const [note, setNote] = useState(null);

  const load = useCallback(
    () => api.portfolio().then((d) => setItems(d.projects)).catch((e) => setNote({ type: "error", text: e.message })),
    []
  );
  useEffect(() => { load(); }, [load]);

  const startEdit = (p) => setEditing({ ...p, tech: p.tech.join(", ") });

  async function save(e) {
    e.preventDefault();
    const { id, ...rest } = editing;
    const body = { ...rest, tech: rest.tech.split(",").map((t) => t.trim()).filter(Boolean) };
    try {
      if (id) await admin.put(`/projects/${id}`, body);
      else await admin.post("/projects", body);
      setEditing(null);
      setNote({ type: "ok", text: id ? "Project updated." : "Project added." });
      load();
    } catch (err) {
      setNote({ type: "error", text: err.message });
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    try {
      await admin.del(`/projects/${p.id}`);
      setNote({ type: "ok", text: "Project deleted." });
      load();
    } catch (err) {
      setNote({ type: "error", text: err.message });
    }
  }

  return (
    <div className="stack">
      <div className="row between">
        <Notice note={note} />
        {!editing && (
          <button className="btn btn-primary" onClick={() => { setNote(null); setEditing({ ...EMPTY_PROJECT }); }}>
            Add project
          </button>
        )}
      </div>

      {editing && (
        <form className="panel form" onSubmit={save}>
          <h2 className="panel-title">{editing.id ? "Edit project" : "New project"}</h2>
          <Field label="Title" required maxLength={120} value={editing.title} onChange={(v) => setEditing({ ...editing, title: v })} />
          <Field label="Description" textarea maxLength={1200} value={editing.description} onChange={(v) => setEditing({ ...editing, description: v })} />
          <Field label="Technologies (comma separated)" value={editing.tech} placeholder="React, FastAPI, PostgreSQL"
            onChange={(v) => setEditing({ ...editing, tech: v })} />
          <div className="grid-2">
            <Field label="Source code URL" value={editing.repo_url} placeholder="https://github.com/..."
              onChange={(v) => setEditing({ ...editing, repo_url: v })} />
            <Field label="Live demo URL" value={editing.live_url} placeholder="https://..."
              onChange={(v) => setEditing({ ...editing, live_url: v })} />
          </div>
          <div className="row">
            <button className="btn btn-primary">{editing.id ? "Save changes" : "Add project"}</button>
            <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 && !editing && <p className="muted">No projects yet. Add your first one.</p>}
      <ul className="admin-list">
        {items.map((p) => (
          <li key={p.id} className="panel item">
            <div>
              <strong>{p.title}</strong>
              <p className="muted clamp">{p.description}</p>
            </div>
            <div className="row">
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(p)}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => remove(p)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- skills ---------- */
const LEVELS = [
  [1, "1 - Learning"],
  [2, "2 - Basic"],
  [3, "3 - Working"],
  [4, "4 - Strong"],
  [5, "5 - Expert"],
];

function SkillsManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", category: "", level: 3 });
  const [editingId, setEditingId] = useState(null);
  const [note, setNote] = useState(null);

  const load = useCallback(
    () => api.portfolio().then((d) => setItems(d.skills)).catch((e) => setNote({ type: "error", text: e.message })),
    []
  );
  useEffect(() => { load(); }, [load]);

  const categories = [...new Set(items.map((s) => s.category))];
  const reset = () => { setForm({ name: "", category: form.category, level: 3 }); setEditingId(null); };

  async function save(e) {
    e.preventDefault();
    const body = { ...form, level: Number(form.level) };
    try {
      if (editingId) await admin.put(`/skills/${editingId}`, body);
      else await admin.post("/skills", body);
      setNote({ type: "ok", text: editingId ? "Skill updated." : "Skill added." });
      reset();
      load();
    } catch (err) {
      setNote({ type: "error", text: err.message });
    }
  }

  async function remove(s) {
    try {
      await admin.del(`/skills/${s.id}`);
      if (editingId === s.id) reset();
      load();
    } catch (err) {
      setNote({ type: "error", text: err.message });
    }
  }

  return (
    <div className="stack">
      <form className="panel form" onSubmit={save}>
        <h2 className="panel-title">{editingId ? "Edit skill" : "Add a skill"}</h2>
        <div className="grid-3">
          <Field label="Skill" required maxLength={60} value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <label>
            Category
            <input required maxLength={40} list="skill-categories" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <datalist id="skill-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </label>
          <label>
            Level
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <div className="row">
          <button className="btn btn-primary">{editingId ? "Save changes" : "Add skill"}</button>
          {editingId && <button type="button" className="btn btn-ghost" onClick={reset}>Cancel</button>}
          <Notice note={note} />
        </div>
      </form>

      {items.length === 0 && <p className="muted">No skills yet.</p>}
      <ul className="admin-list">
        {items.map((s) => (
          <li key={s.id} className="panel item">
            <div>
              <strong>{s.name}</strong>
              <span className="muted"> &nbsp;{s.category}, level {s.level}</span>
            </div>
            <div className="row">
              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(s.id); setForm({ name: s.name, category: s.category, level: s.level }); }}>Edit</button>
              <button className="btn btn-danger btn-sm" onClick={() => remove(s)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- messages ---------- */
function Messages({ onCount }) {
  const [items, setItems] = useState(null);
  const [note, setNote] = useState(null);

  const load = useCallback(
    () => admin.get("/messages").then((m) => { setItems(m); onCount(m.length); }).catch((e) => setNote({ type: "error", text: e.message })),
    [onCount]
  );
  useEffect(() => { load(); }, [load]);

  async function remove(m) {
    try {
      await admin.del(`/messages/${m.id}`);
      load();
    } catch (err) {
      setNote({ type: "error", text: err.message });
    }
  }

  if (!items) return <p className="muted">Loading...</p>;
  return (
    <div className="stack">
      <Notice note={note} />
      {items.length === 0 && <p className="muted">No messages yet. Messages sent from the contact form appear here.</p>}
      <ul className="admin-list">
        {items.map((m) => (
          <li key={m.id} className="panel message">
            <div className="row between">
              <div>
                <strong>{m.name}</strong>{" "}
                <a href={`mailto:${m.email}`}>{m.email}</a>
              </div>
              <span className="muted small">{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p className="body-text">{m.body}</p>
            <button className="btn btn-danger btn-sm" onClick={() => remove(m)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- dashboard shell ---------- */
const TABS = ["Profile", "Projects", "Skills", "Messages"];

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("Projects");
  const [count, setCount] = useState(null);

  useEffect(() => {
    admin.get("/messages").then((m) => setCount(m.length)).catch(() => {});
  }, []);

  return (
    <>
      <header className="site-header">
        <div className="wrap header-inner">
          <strong>Portfolio admin</strong>
          <nav className="nav" aria-label="Admin">
            <Link to="/">View site</Link>
            <button className="linklike" onClick={onLogout}>Sign out</button>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="wrap admin">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "tab active" : "tab"} onClick={() => setTab(t)}>
              {t}{t === "Messages" && count ? ` (${count})` : ""}
            </button>
          ))}
        </div>
        {tab === "Profile" && <ProfileEditor />}
        {tab === "Projects" && <ProjectsManager />}
        {tab === "Skills" && <SkillsManager />}
        {tab === "Messages" && <Messages onCount={setCount} />}
      </main>
    </>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(null);

  useEffect(() => {
    document.title = "Admin | Portfolio";
    const lost = () => setAuthed(false);
    window.addEventListener("admin-unauthorized", lost);
    if (!getToken()) setAuthed(false);
    else api.me().then(() => setAuthed(true)).catch(() => setAuthed(false));
    return () => window.removeEventListener("admin-unauthorized", lost);
  }, []);

  if (authed === null) return <main className="state-screen"><p className="muted">Checking session...</p></main>;
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { setToken(null); setAuthed(false); }} />;
}

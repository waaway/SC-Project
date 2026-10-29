import React, { useEffect, useMemo, useRef, useState } from "react";
import AuthGate from "./AuthGate.jsx";
import AuditWorkspace from "./AuditWorkspace.jsx";
import PlanningWorkspace from "./PlanningWorkspace.jsx";
import ProjectDocumentsWorkspace from "./ProjectDocumentsWorkspace.jsx";
import { createRoot } from "react-dom/client";
import {
  Activity, ArrowUpRight, Bell, BookOpen, BriefcaseBusiness, CalendarDays, LogOut,
  Check, ChevronDown, ChevronRight, ClipboardCheck, Clock3, FileCheck2,
  FileText, FolderKanban, LayoutDashboard, LockKeyhole, Menu, MessageSquareText,
  MoreHorizontal, Plus, Search, Settings2, ShieldCheck, Sparkles, Trash2, Users, ImagePlus, X, Zap, Eye, EyeOff, Bot, Send
} from "lucide-react";
import "./styles.css";

const workflow = [
  { name: "Mainload", desc: "Project intake & scope", icon: FolderKanban, tone: "mint" },
  { name: "Proposal", desc: "Proposal & quotation", icon: FileText, tone: "blue" },
  { name: "Kick-off", desc: "Project initiation", icon: CalendarDays, tone: "violet" },
  { name: "Interview Questions", desc: "Client interview preparation", icon: MessageSquareText, tone: "amber" },
  { name: "Audit Checklist", desc: "Control assessment", icon: ClipboardCheck, tone: "mint" },
  { name: "Audit Report", desc: "Findings & recommendations", icon: FileCheck2, tone: "blue" },
  { name: "Close Meeting", desc: "Closure & handover", icon: Users, tone: "violet" },
  { name: "Policy", desc: "Policies & reference library", icon: BookOpen, tone: "amber" }
];

function Logo() {
  return <div className="brand-mark ecq-mini"><img src="/images/ecq-logo.svg" alt="ECQ" /></div>;
}

function UserAvatar({ username, hasAvatar, avatarUpdatedAt, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => { setImageFailed(false); }, [hasAvatar, avatarUpdatedAt]);
  return <div className={`avatar avatar-mint ${className}`.trim()} aria-label={`${username || "User"} profile picture`}>
    {hasAvatar && !imageFailed
      ? <img src={`/api/account/avatar?v=${encodeURIComponent(avatarUpdatedAt || "")}`} alt="" onError={() => setImageFailed(true)} />
      : (username || "SC").slice(0,2).toUpperCase()}
  </div>;
}

function Sidebar({ active, navigate, mobileOpen, closeMobile, username, role, roleName, hasAvatar, avatarUpdatedAt, allowedPages = [] }) {
  return <>
    {mobileOpen && <div className="mobile-scrim" onClick={closeMobile} />}
    <aside className={"sidebar " + (mobileOpen ? "sidebar-open" : "")}>
      <div className="brand"><Logo/><div><strong>SC <span>CONTROL</span></strong><small>ECQ SECURITY CONSULTING</small></div><button className="close-menu icon-button" onClick={closeMobile}><X size={17}/></button></div>
      <div className="workspace-switch"><div className="workspace-monogram">SC</div><div className="workspace-label"><b>SC Workspace</b><span>Internal environment</span></div><ChevronDown size={14}/></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>
        {allowedPages.includes("Dashboard") && <button className={"nav-link " + (active === "Dashboard" ? "active" : "")} onClick={() => navigate("Dashboard")}><LayoutDashboard size={17}/><span>Dashboard</span><kbd>⌘ 1</kbd></button>}
        {allowedPages.includes("Projects") && <button className={"nav-link " + (active === "Projects" ? "active" : "")} onClick={() => navigate("Projects")}><BriefcaseBusiness size={17}/><span>Projects</span></button>}
      </nav>
      <div className="nav-caption workflow-caption">SC WORKFLOW <span>{workflow.filter(w=>allowedPages.includes(w.name)).length.toString().padStart(2,"0")}</span></div>
      <nav className="workflow-nav">
        {workflow.filter(item=>allowedPages.includes(item.name)).map((item) => {
          const Icon = item.icon;
          return <button key={item.name} className={"nav-link workflow-link " + (active === item.name ? "active" : "")} onClick={() => navigate(item.name)}>
            <span className={"nav-mini-icon " + item.tone}><Icon size={15}/></span><span>{item.name}</span>
          </button>;
        })}
      </nav>
      {allowedPages.includes("AI Assistant") && <button className={"nav-link workflow-link audit-nav-link " + (active === "AI Assistant" ? "active" : "")} onClick={() => navigate("AI Assistant")}><span className="nav-mini-icon"><Bot size={15}/></span><span>AI Assistant</span></button>}
      {allowedPages.includes("Audit Logs") && <button className={"nav-link workflow-link audit-nav-link " + (active === "Audit Logs" ? "active" : "")} onClick={() => navigate("Audit Logs")}><span className="nav-mini-icon"><Activity size={15}/></span><span>Audit Logs</span></button>}
      <div className="sidebar-bottom">
        <div className="assistant-card"><Sparkles size={17}/><div className="assistant-title">SC AI Assistant <span>{allowedPages.includes("AI Assistant") ? "READY" : "RESTRICTED"}</span></div><p>Security guidance for authorized assessment work.</p><div className="assistant-track"><i/></div><small>{allowedPages.includes("AI Assistant") ? "Assistant available" : "Access controlled"} <LockKeyhole size={12}/></small></div>
        {allowedPages.includes("Settings") && <button className={"nav-link " + (active === "Settings" ? "active" : "")} onClick={() => navigate("Settings")}><Settings2 size={17}/><span>{role === "admin" ? "Users & Access" : "Access Management"}</span></button>}
        <button className="profile profile-button" onClick={() => navigate("My Profile")} title="Manage your account"><UserAvatar username={username} hasAvatar={hasAvatar} avatarUpdatedAt={avatarUpdatedAt}/><div><b>{username || "SC User"}</b><span>{roleName || (role === "admin" ? "Admin" : role === "manager" ? "Manager" : role === "user" ? "User" : role)}</span></div><MoreHorizontal size={18}/></button>
      </div>
    </aside>
  </>;
}

function Topbar({ title, subtitle, search, setSearch, onCreate, canCreate, onMobileMenu, onLogout, username, hasAvatar, avatarUpdatedAt, navigate }) {
  return <header className="topbar">
    <button className="mobile-menu icon-button" onClick={onMobileMenu}><Menu size={20}/></button>
    <div className="page-title"><div className="breadcrumb">SC WORKSPACE <ChevronRight size={12}/> <span>{title.toUpperCase()}</span></div><h1>{title}</h1><p>{subtitle}</p></div>
    <div className="top-actions">
      <label className="global-search"><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."/><kbd>⌘ K</kbd></label>
      <button className="icon-button" aria-label="Notifications not configured" title="Notifications are not configured yet" disabled><Bell size={17}/></button>
      <div className="top-separator"/>
      <button className="icon-button" title="Sign out" aria-label="Sign out" onClick={onLogout}><LogOut size={16}/></button>
      {canCreate && <button className="primary-button new-project" onClick={onCreate}><Plus size={16}/> New project</button>}
    </div>
  </header>;
}

function StatCard({ label, value, note, change, icon: Icon, tone, caution }) {
  return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className={"stat-icon " + tone}><Icon size={17}/></span></div><div className="stat-number"><strong>{value}</strong><span className={caution ? "change caution" : "change"}>{caution ? <Clock3 size={12}/> : <ArrowUpRight size={12}/>} {change}</span></div><p>{note}</p></div>;
}

function Status({ value }) {
  return <span className={"status status-" + value.toLowerCase().replaceAll(" ", "-")}><i/>{value}</span>;
}

function ProjectTable({ projects, onOpen, loading = false }) {
  return <div className="table-scroll"><table><thead><tr><th>PROJECT / CLIENT</th><th>WORKFLOW STAGE</th><th>PROGRESS</th><th>OWNER</th><th>DUE DATE</th><th>STATUS</th><th/></tr></thead>
    <tbody>{projects.map(p => <tr key={p.id} onClick={() => onOpen(p)}><td><div className="project-name"><span className={"project-symbol " + p.tone}><ShieldCheck size={16}/></span><div><b>{p.name}</b><small>{p.id} <i>·</i> {p.client}</small></div></div></td><td className="stage-text">{p.stage}</td><td><div className="progress-cell"><span className="progress-track"><i style={{width: p.progress + "%"}}/></span><small>{p.progress}%</small></div></td><td><div className="owner"><span>{p.initials}</span>{p.owner}</div></td><td className="due-date">{p.due}</td><td><Status value={p.status}/></td><td><button className="row-more" onClick={e => {e.stopPropagation();onOpen(p);}}><MoreHorizontal size={17}/></button></td></tr>)}</tbody>
  </table>{loading ? <div className="empty-state"><span className="loading-dot"/><b>Loading projects...</b></div> : projects.length === 0 && <div className="empty-state"><Search size={22}/><b>No projects yet</b><span>Create a project to begin populating this workspace.</span></div>}</div>;
}

function WorkflowGrid({ navigate, allowedPages = [] }) {
  return <div className="workflow-grid">{workflow.filter(item=>allowedPages.includes(item.name)).map((item) => { const Icon = item.icon; return <button className="workflow-card" key={item.name} onClick={() => navigate(item.name)}><div className="workflow-card-top"><span className={"workflow-icon " + item.tone}><Icon size={19}/></span><small>{String(workflow.indexOf(item)+1).padStart(2,"0")}</small></div><b>{item.name}</b><p>{item.desc}</p><div className="workflow-card-bottom"><span>Open module</span><ArrowUpRight size={15}/></div></button>; })}</div>;
}

function ProjectModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [stage, setStage] = useState("Mainload");
  const [owner, setOwner] = useState("");
  const submit = e => { e.preventDefault(); if (name.trim() && client.trim()) { onSave({name: name.trim(), client: client.trim(), stage, owner}); onClose(); } };
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modal-heading"><div><small>SC WORKSPACE</small><h2>Create new project</h2><p>Add a project to the SC workflow.</p></div><button className="icon-button" type="button" onClick={onClose}><X size={17}/></button></div>
    <label className="field">Project name<input required autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Enter project name"/></label>
    <label className="field">Client / organization<input required value={client} onChange={e => setClient(e.target.value)} placeholder="Enter client name"/></label>
    <div className="field-grid"><label className="field">Starting stage<select value={stage} onChange={e => setStage(e.target.value)}>{workflow.map(w => <option key={w.name}>{w.name}</option>)}</select></label><label className="field">Project owner (optional)<input value={owner} onChange={e=>setOwner(e.target.value)} placeholder="Assign later"/></label></div>
    <div className="modal-note"><LockKeyhole size={14}/> A new project starts at Mainload with no progress or due date until details are added.</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button type="submit" className="primary-button"><Plus size={15}/> Create project</button></div>
  </form></div>;
}

function ProjectDetail({ project, onClose }) {
  if (!project) return null;
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="modal detail-modal"><div className="modal-heading"><div><small>{project.id}</small><h2>{project.name}</h2><p>{project.client}</p></div><button className="icon-button" onClick={onClose}><X size={17}/></button></div>
    <div className="detail-metrics"><div><small>Workflow stage</small><b>{project.stage}</b></div><div><small>Progress</small><b>{project.progress}%</b></div><div><small>Due date</small><b>{project.due}</b></div></div><div className="detail-progress"><span className="progress-track"><i style={{width: project.progress + "%"}}/></span></div><h3>Project workflow</h3>
    <div className="detail-workflow">{workflow.map(w => {const Icon = w.icon; return <div className={"detail-stage " + (w.name === project.stage ? "current" : "")} key={w.name}><Icon size={15}/><span>{w.name}</span>{w.name === project.stage ? <small>Current stage</small> : <ChevronRight size={14}/>}</div>;})}</div>
    <div className="modal-note"><LockKeyhole size={14}/> Project data is stored in the local SQLite database.</div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Close</button></div>
  </div></div>;
}

function ModulePage({ name }) {
  const item = workflow.find(w => w.name === name);
  if (!item) return <section className="module-page"><div className="module-heading"><Settings2 size={25}/><div><small>SC WORKSPACE</small><h2>Settings</h2><p>Workspace preferences and access configuration.</p></div></div><div className="notice"><LockKeyhole size={18}/><div><b>Configuration foundation</b><p>Workspace configuration is not connected yet.</p></div></div></section>;
  const Icon = item.icon;
  return <section className="module-page"><div className="module-heading"><span className={"module-icon " + item.tone}><Icon size={24}/></span><div><small>SC WORKFLOW / MODULE</small><h2>{name}</h2><p>{item.desc}</p></div></div>
    <div className="notice"><Sparkles size={18}/><div><b>Module structure ready</b><p>This section is an empty foundation. Workflow fields, records, file uploads and actions will appear here when implemented.</p></div></div>
    <section className="panel module-records"><div className="panel-heading"><div><h3>{name} records</h3><p>No records have been added.</p></div></div><div className="empty-state"><FileText size={22}/><b>No records yet</b><span>The structure is ready for workflow data.</span></div></section>
  </section>;
}

function AIAssistantPage() {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [configured, setConfigured] = useState(false);
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch("/api/ai/status").then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load AI status."); return d; }),
      fetch("/api/ai/projects").then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load available projects."); return d; })
    ]).then(([status, data]) => { if (alive) { setConfigured(!!status.configured); setProjects(Array.isArray(data.projects) ? data.projects : []); } })
      .catch(e => { if (alive) setError(e.message || "Could not initialize AI Assistant."); });
    return () => { alive = false; };
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, busy]);
  const send = async e => {
    e?.preventDefault();
    const content = prompt.trim();
    if (!content || busy) return;
    const next = [...messages, { role: "user", content }];
    setMessages(next); setPrompt(""); setBusy(true); setError("");
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, projectId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The AI request failed.");
      setMessages([...next, { role: "assistant", content: data.answer }]);
    } catch (e) { setError(e.message || "The AI request failed."); }
    finally { setBusy(false); }
  };
  const suggestions = [
    "Explain how to validate a suspected security finding.",
    "Help me plan information gathering using OWASP WSTG.",
    "Draft a clear finding summary from evidence I provide."
  ];
  return <section className="module-page ai-page">
    <div className="module-heading"><span className="module-icon mint"><Bot size={24}/></span><div><small>SC WORKSPACE / AI</small><h2>AI Assistant</h2><p>Security assessment guidance with permission-scoped project context.</p></div></div>
    {!configured && <div className="notice ai-setup-notice"><LockKeyhole size={18}/><div><b>AI provider setup required</b><p>Add OPENAI_API_KEY to the server-side .env file and restart the app. The key is never sent to the browser. Until configured, messages will not be sent.</p></div></div>}
    <section className="panel ai-chat-panel">
      <div className="panel-heading ai-chat-heading"><div><h3><Sparkles size={16}/> SC AI Assistant</h3><p>Read-only assistant · No scans or actions are executed</p></div><span className={"ai-status-pill " + (configured ? "configured" : "not-configured")}><i/>{configured ? "Provider connected" : "Setup required"}</span></div>
      <div className="ai-context-row"><label htmlFor="ai-project-context">Project context</label><select id="ai-project-context" value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="">General security guidance</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.id}</option>)}</select><small>Only projects you are authorized to view are listed.</small></div>
      <div className="ai-message-list" aria-live="polite">
        {messages.length === 0 ? <div className="ai-empty"><span className="ai-empty-icon"><Bot size={26}/></span><h3>How can I help with your assessment?</h3><p>Ask about security concepts, WSTG test planning, scan output, or drafting findings. Verify recommendations before using them in client work.</p><div className="ai-suggestions">{suggestions.map(s=><button key={s} type="button" onClick={()=>setPrompt(s)}>{s}<ChevronRight size={14}/></button>)}</div></div> : messages.map((m,i)=><article key={i} className={"ai-message " + m.role}><span className="ai-message-icon">{m.role === "assistant" ? <Bot size={15}/> : <Users size={15}/>}</span><div><small>{m.role === "assistant" ? "SC AI ASSISTANT" : "YOU"}</small><p>{m.content}</p></div></article>)}
        {busy && <article className="ai-message assistant"><span className="ai-message-icon"><Bot size={15}/></span><div><small>SC AI ASSISTANT</small><p className="ai-thinking"><i/><i/><i/> Thinking...</p></div></article>}
        <div ref={endRef}/>
      </div>
      {error && <div className="auth-error ai-error">{error}</div>}
      <form className="ai-composer" onSubmit={send}><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} maxLength={4000} rows={2} placeholder="Ask a security question..." aria-label="Message AI Assistant"/><div className="ai-composer-footer"><span>Do not include passwords, API keys, or unnecessary client-sensitive data.</span><button type="submit" className="primary-button" disabled={!prompt.trim() || busy}><Send size={15}/>{busy ? "Working..." : "Send"}</button></div></form>
    </section>
    <p className="ai-disclaimer"><ShieldCheck size={14}/> AI responses may be inaccurate. Treat output as guidance, validate findings with evidence, and follow your organization's approved assessment scope.</p>
  </section>;
}

function AdminAccessPage({ currentUserId, role }) {
  const isAdmin = role === "admin";
  const [data, setData] = useState({users:[],projects:[],pages:[],roles:[]});
  const [roleCatalog, setRoleCatalog] = useState([]);
  const [permissionCatalog, setPermissionCatalog] = useState([]);
  const [roleName, setRoleName] = useState("");
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [roleDescription, setRoleDescription] = useState("");
  const [rolePermissions, setRolePermissions] = useState([]);
  const [rolePermissionSearch, setRolePermissionSearch] = useState("");
  const [roleSaving, setRoleSaving] = useState(false);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [pages, setPages] = useState([]);
  const [projectIds, setProjectIds] = useState([]);
  const [expandedProjectId, setExpandedProjectId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showTemporaryPassword, setShowTemporaryPassword] = useState(false);
  const [roleToCreate, setRoleToCreate] = useState("user");
  const [selectedRole, setSelectedRole] = useState("user");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const load = async () => {
    const r = await fetch("/api/admin/access");
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Failed to load access permissions.");
    setData(d);
    setRoleCatalog(d.roles || []);
    if (isAdmin) {
      const rr = await fetch("/api/admin/roles");
      const rd = await rr.json();
      if (!rr.ok) throw new Error(rd.error || "Failed to load roles.");
      setRoleCatalog(rd.roles || []);
      setPermissionCatalog(rd.permissions || []);
    }
    const chosen = d.users.find(u => String(u.id) === String(selectedId)) || d.users.find(u => u.role !== "admin");
    if (chosen) { setSelectedId(String(chosen.id)); setSelectedRole(chosen.role); setPages(chosen.pages || []); setProjectIds(chosen.projectIds || []); }
    else { setSelectedId(""); setSelectedRole("user"); setPages([]); setProjectIds([]); }
  };
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  const chooseUser = id => {
    setSelectedId(id);
    const u = data.users.find(x => String(x.id) === String(id));
    setSelectedRole(u?.role || "user"); setPages(u?.pages || []); setProjectIds(u?.projectIds || []); setNotice(""); setError("");
  };
  const createRole = async e => {
    e.preventDefault(); setNotice(""); setError(""); setRoleSaving(true);
    try {
      const endpoint=editingRoleId ? "/api/admin/roles/"+editingRoleId : "/api/admin/roles";
      const r=await fetch(endpoint,{method:editingRoleId?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:roleName,description:roleDescription,permissions:rolePermissions})});
      const d=await r.json();
      if(!r.ok||(!d.ok && !editingRoleId)) throw new Error(d.error||"Failed to save role.");
      const savedName=roleName;
      setRoleName(""); setRoleDescription(""); setRolePermissions([]); setRolePermissionSearch(""); setEditingRoleId(null);
      setNotice(`Role "${savedName}" ${editingRoleId?"updated":"created"} successfully.`);
      await load();
    } catch(e) { setError(e.message||"Failed to create role."); }
    finally { setRoleSaving(false); }
  };
  const deleteRole = async role => {
    if(!role||role.is_system||!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    setNotice(""); setError("");
    try {
      const r=await fetch("/api/admin/roles/"+role.id,{method:"DELETE"});
      const d=await r.json();
      if(!r.ok||!d.ok) throw new Error(d.error||"Failed to delete role.");
      setNotice(`Role "${role.name}" deleted.`);
      await load();
    } catch(e) { setError(e.message||"Failed to delete role."); }
  };
  const createUser = async e => {
    e.preventDefault(); setNotice(""); setError("");
    try {
      const r = await fetch("/api/users", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password,role:roleToCreate})});
      const d = await r.json(); if (!r.ok) throw new Error(d.error || "Failed to create user.");
      setUsername(""); setPassword(""); setNotice("Created account " + d.user.username + ". Please assign page and project access.");
      await load(); setSelectedId(String(d.user.id)); setSelectedRole(d.user.role); setPages([]); setProjectIds([]);
    } catch(e) { setError(e.message); }
  };
  const deleteUser = async () => {
    const target = data.users.find(u => String(u.id) === String(selectedId));
    if (!target || Number(target.id) === Number(currentUserId) || deleting) return;
    if (!window.confirm(`Delete user "${target.username}"? This action cannot be undone.`)) return;
    setDeleting(true); setNotice(""); setError("");
    try {
      const r = await fetch("/api/admin/users/" + encodeURIComponent(selectedId), {method:"DELETE"});
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed to delete user.");
      setNotice(`User "${target.username}" was deleted successfully.`);
      setSelectedId(""); setPages([]); setProjectIds([]);
      await load();
    } catch(e) { setError(e.message || "Failed to delete user."); }
    finally { setDeleting(false); }
  };
  const saveRole = async () => {
    if (!isAdmin || !selectedId || saving) return;
    const target = data.users.find(u => String(u.id) === String(selectedId));
    if (!target || target.role === "admin" || target.role === selectedRole) return;
    setSaving(true); setNotice(""); setError("");
    try {
      const r = await fetch("/api/admin/users/" + encodeURIComponent(selectedId) + "/role", {method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({role:selectedRole})});
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed to update role.");
      setNotice(`Role for "${target.username}" changed to ${roleCatalog.find(r=>r.slug===selectedRole)?.name || selectedRole}.`);
      await load();
    } catch(e) { setError(e.message || "Failed to update role."); }
    finally { setSaving(false); }
  };
  const saveAccess = async () => {
    if (!selectedId || saving) return;
    setSaving(true); setNotice(""); setError("");
    try {
      const r = await fetch("/api/admin/users/" + encodeURIComponent(selectedId) + "/access", {method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({pages,projectIds})});
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed to save permissions.");
      setPages(d.pages || []);
      setProjectIds(d.projectIds || []);
      setData(prev => ({...prev,users:prev.users.map(u=>String(u.id)===String(selectedId)?{...u,pages:d.pages||[],projectIds:d.projectIds||[]}:u)}));
      setNotice("Page and project permissions saved successfully.");
    } catch(e) { setError(e.message || "Failed to save permissions."); }
    finally { setSaving(false); }
  };
  const toggle = (list,set,value) => set(list.includes(value) ? list.filter(x=>x!==value) : [...list,value]);
  return <section className="module-page">
    <div className="module-heading"><span className="module-icon mint"><Users size={24}/></span><div><small>ADMINISTRATION</small><h2>{isAdmin ? "Users & Access" : "Access Management"}</h2><p>{isAdmin ? "Create accounts, assign roles, and manage access." : "Manage page and project access for standard users."}</p></div></div>
    {notice && <div className="notice"><ShieldCheck size={18}/><div><b>{notice}</b></div></div>}
    {error && <div className="auth-error">{error}</div>}
    {isAdmin && <section className={"panel roles-management-panel " + (showRoleManager ? "roles-management-open" : "roles-management-compact")}>
      <div className="panel-heading role-manager-heading"><div><h3>Role configuration</h3><p>{roleCatalog.length} roles available · Change role permissions when needed.</p></div><button type="button" className="secondary-button role-manager-toggle" onClick={() => setShowRoleManager(v => !v)}>{showRoleManager ? <><X size={14}/> Close</> : <><Settings2 size={14}/> Manage roles</>}</button></div>
      {showRoleManager && <div className="roles-layout">
        <form className="role-create-form" onSubmit={createRole}>
          <h3><Plus size={16}/> {editingRoleId ? "Edit role" : "Create role"}</h3>
          <label className="field">Role name<input required minLength={2} maxLength={40} pattern="[A-Za-z][A-Za-z0-9 _-]+" value={roleName} onChange={e=>setRoleName(e.target.value)} placeholder="Security Analyst"/></label>
          <label className="field">Description<input maxLength={240} value={roleDescription} onChange={e=>setRoleDescription(e.target.value)} placeholder="Describe what this role does"/></label>
          <div className="role-permission-picker">
            <div className="role-permission-heading"><div><b>Permissions</b><small>Select only what this role needs. Access is enforced by the server.</small></div><span className="role-selected-count">{rolePermissions.length} selected</span></div>
            <input className="role-permission-search" type="search" value={rolePermissionSearch} onChange={e=>setRolePermissionSearch(e.target.value)} placeholder="Search permissions..." aria-label="Search permissions"/>
            {[...new Set(permissionCatalog.map(p=>p.category))].map(category=>{const items=permissionCatalog.filter(p=>p.category===category&&((p.label+" "+p.permission_key).toLowerCase().includes(rolePermissionSearch.trim().toLowerCase())));if(!items.length)return null;const allSelected=items.every(p=>rolePermissions.includes(p.permission_key));return <div key={category} className="role-permission-group"><div className="role-permission-group-heading"><small>{category}</small><button type="button" className="text-button" onClick={()=>setRolePermissions(old=>{const next=allSelected?old.filter(k=>!items.some(p=>p.permission_key===k)):[...new Set([...old,...items.map(p=>p.permission_key)])];if(next.includes("projects:create")&&!next.includes("page:Projects"))next.push("page:Projects");return next})}>{allSelected?"Clear shown":"Select shown"}</button></div>{items.map(p=><label key={p.permission_key} className="permission-row"><input type="checkbox" checked={rolePermissions.includes(p.permission_key)} onChange={()=>setRolePermissions(old=>{const has=old.includes(p.permission_key);if(p.permission_key==="projects:create"&&!has)return [...new Set([...old,p.permission_key,"page:Projects"])];if(p.permission_key==="page:Projects"&&has)return old.filter(k=>k!=="page:Projects"&&k!=="projects:create");return has?old.filter(k=>k!==p.permission_key):[...old,p.permission_key]})}/><span><b>{p.label}</b><small>{p.permission_key}{p.permission_key==="projects:create"?" · Also grants Projects page access":""}</small></span></label>)}</div>})}
            {permissionCatalog.filter(p=>(p.label+" "+p.permission_key).toLowerCase().includes(rolePermissionSearch.trim().toLowerCase())).length===0&&<p className="role-permission-empty">No permissions match your search.</p>}
          </div>
          <div className="role-form-actions"><button className="primary-button" type="submit" disabled={roleSaving}>{roleSaving?(editingRoleId?"Saving changes...":"Creating role..."):<><Plus size={15}/> {editingRoleId?"Save changes":"Create role"}</>}</button>{editingRoleId && <button className="secondary-button" type="button" onClick={()=>{setEditingRoleId(null);setRoleName("");setRoleDescription("");setRolePermissions([])}}>Cancel</button>}</div>
        </form>
        <div className="role-catalog-list"><h3>Available roles</h3>{roleCatalog.map(r=><div className="role-catalog-row" key={r.id}><div className="role-catalog-info"><b>{r.name}{r.is_system ? <span className="role-system-label">SYSTEM</span>:null}</b><small>{r.description || "No description"} · {r.permissions?.length ?? 0} permissions</small></div>{!r.is_system && <div className="role-row-actions"><button type="button" className="secondary-button" onClick={()=>{setShowRoleManager(true);setEditingRoleId(r.id);setRoleName(r.name);setRoleDescription(r.description||"");setRolePermissions(r.permissions||[]);setRolePermissionSearch("")}}>Edit</button><button type="button" className="delete-user-button" onClick={()=>deleteRole(r)}><Trash2 size={13}/> Delete</button></div>}</div>)}</div>
      </div>}
    </section>}
    <div className="dashboard-columns">
      {isAdmin && <section className="panel">
        <div className="panel-heading"><div><h3>Create user</h3><p>Password must be at least 12 characters.</p></div></div>
        <form className="admin-user-form" onSubmit={createUser}>
          <label className="field">Username<input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" value={username} onChange={e=>setUsername(e.target.value)} placeholder="new.user"/></label>
          <label className="field">Temporary password<div className="password-input-wrap"><input type={showTemporaryPassword ? "text" : "password"} required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter a password that meets the policy."/><button type="button" className="password-visibility-button" onClick={()=>setShowTemporaryPassword(v=>!v)} aria-label={showTemporaryPassword ? "Hide temporary password" : "Show temporary password"} title={showTemporaryPassword ? "Hide password" : "Show password"}>{showTemporaryPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
          <div className="password-policy" aria-live="polite">
            <p>Password policy</p>
            {[
              [password.length >= 12 && password.length <= 128, "12-128 characters"],
              [/[A-Z]/.test(password), "Contains an uppercase letter (A-Z)"],
              [/[a-z]/.test(password), "Contains a lowercase letter (a-z)"],
              [/[0-9]/.test(password), "Contains a number (0-9)"],
              [/[^A-Za-z0-9]/.test(password), "Contains a special character, e.g. ! @ # $ %"],
            ].map(([valid,label])=><div className={valid ? "password-rule valid" : "password-rule"} key={label}><span>{valid ? "✓" : "○"}</span>{label}</div>)}
          </div>
          <label className="field">Role<select value={roleToCreate} onChange={e=>setRoleToCreate(e.target.value)}>{roleCatalog.filter(r=>r.slug!=="admin").map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}</select></label>
          <button className="primary-button" type="submit"><Plus size={15}/> Create user</button>
        </form>
        <div className="admin-user-list"><div className="admin-user-list-heading"><h3>Accounts ({data.users.length})</h3>{selectedId && Number(selectedId) !== Number(currentUserId) && <button type="button" className="delete-user-button" onClick={deleteUser} disabled={deleting}><Trash2 size={14}/>{deleting ? "Deleting..." : "Delete User"}</button>}</div>{data.users.map(u=><button key={u.id} className={"admin-user-row "+(String(u.id)===String(selectedId)?"selected":"")} onClick={()=>chooseUser(String(u.id))}><span className="avatar avatar-mint">{u.username.slice(0,2).toUpperCase()}</span><span><b>{u.username}</b><small>{u.roleName || u.role} · ID {u.id}</small></span><ChevronRight size={15}/></button>)}</div>
      </section>}
      {!isAdmin && <section className="panel">
        <div className="panel-heading"><div><h3>Users</h3><p>Select a standard account to manage its access.</p></div></div>
        <div className="admin-user-list"><div className="admin-user-list-heading"><h3>Standard users ({data.users.length})</h3></div>{data.users.map(u=><button key={u.id} className={"admin-user-row "+(String(u.id)===String(selectedId)?"selected":"")} onClick={()=>chooseUser(String(u.id))}><span className="avatar avatar-mint">{u.username.slice(0,2).toUpperCase()}</span><span><b>{u.username}</b><small>User · ID {u.id}</small></span><ChevronRight size={15}/></button>)}</div>
      </section>}
      <section className="panel">
        <div className="panel-heading"><div><h3>Access permissions</h3><p>Select a user to manage access.</p></div></div>
        {!selectedId ? <div className="empty-state">{isAdmin ? "Create or select an account first." : "No standard User accounts are available to manage yet."}</div> : data.users.find(u=>String(u.id)===String(selectedId))?.role === "admin" ? <div className="notice"><ShieldCheck size={18}/><div><b>Single Admin account</b><p>Admin has full access. The Admin role cannot be created, reassigned, or removed from this screen.</p></div></div> : data.users.find(u=>String(u.id)===String(selectedId))?.role === "manager" ? <><div className="notice"><ShieldCheck size={18}/><div><b>Manager access</b><p>Managers have access to all operational pages and projects plus Access Management. They cannot access Audit Logs or create accounts.</p></div></div>{isAdmin && <div className="admin-role-editor"><label className="field">Account role<select value={selectedRole} onChange={e=>setSelectedRole(e.target.value)}>{roleCatalog.filter(r=>r.slug!=="admin").map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}</select></label><button type="button" className="secondary-button" disabled={saving || selectedRole === data.users.find(u=>String(u.id)===String(selectedId))?.role} onClick={saveRole}>{saving ? "Saving..." : "Save role"}</button></div>}</> : data.users.find(u=>String(u.id)===String(selectedId))?.role !== "user" ? <><div className="notice"><ShieldCheck size={18}/><div><b>Custom role access</b><p>Page and project permissions come from the selected role. Edit its permissions in the Roles & Permissions panel above.</p></div></div>{isAdmin && <div className="admin-role-editor"><label className="field">Account role<select value={selectedRole} onChange={e=>setSelectedRole(e.target.value)}>{roleCatalog.filter(r=>r.slug!=="admin").map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}</select></label><button type="button" className="secondary-button" disabled={saving || selectedRole === data.users.find(u=>String(u.id)===String(selectedId))?.role} onClick={saveRole}>{saving ? "Saving..." : "Save role"}</button></div>}</> : <>
          {isAdmin && <div className="admin-role-editor"><label className="field">Account role<select value={selectedRole} onChange={e=>setSelectedRole(e.target.value)}>{roleCatalog.filter(r=>r.slug!=="admin").map(r=><option key={r.slug} value={r.slug}>{r.name}</option>)}</select></label><button type="button" className="secondary-button" disabled={saving || selectedRole === data.users.find(u=>String(u.id)===String(selectedId))?.role} onClick={saveRole}>{saving ? "Saving..." : "Save role"}</button></div>}
          <h3 className="permission-section-title">Pages</h3>
          <div className="permission-list">{data.pages.map(p=><label key={p} className="permission-row"><input type="checkbox" checked={pages.includes(p)} onChange={()=>toggle(pages,setPages,p)}/><span><b>{p}</b></span></label>)}</div>
          <h3 className="permission-section-title">Projects</h3>
          <div className="permission-list">{data.projects.map(p=><label key={p.id} className="permission-row"><input type="checkbox" checked={projectIds.includes(p.id)} onChange={()=>toggle(projectIds,setProjectIds,p.id)}/><span><b>{p.name}</b><small>{p.id} · {p.client}</small></span></label>)}</div>
          <button type="button" className="primary-button access-save" onClick={saveAccess} disabled={saving}>{saving ? <><span className="loading-dot"/> Saving permissions...</> : <><ShieldCheck size={15}/> Save access permissions</>}</button>
        </>}
      </section>
    </div>
  </section>;
}

function MyProfilePage({ user, onUpdated }) {
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarNotice, setAvatarNotice] = useState("");
  const avatarInputRef = useRef(null);
  useEffect(() => { setUsername(user?.username || ""); }, [user?.id, user?.username]);
  const passwordRules = [
    [newPassword.length >= 12 && newPassword.length <= 128, "12-128 characters"],
    [/[A-Z]/.test(newPassword), "Contains an uppercase letter (A-Z)"],
    [/[a-z]/.test(newPassword), "Contains a lowercase letter (a-z)"],
    [/[0-9]/.test(newPassword), "Contains a number (0-9)"],
    [/[^A-Za-z0-9]/.test(newPassword), "Contains a special character"],
  ];
  const handleAvatarFile = async e => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setAvatarError(""); setAvatarNotice(""); setNotice(""); setError("");
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      setAvatarError("Choose a JPG, PNG, or WebP image."); input.value = ""; return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAvatarError("The selected image is too large. Choose an image under 10 MB."); input.value = ""; return;
    }
    setAvatarSaving(true);
    try {
      const image = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Could not read the selected image."));
        reader.onload = () => {
          const picture = new Image();
          picture.onerror = () => reject(new Error("This image could not be opened. Try another JPG, PNG, or WebP file."));
          picture.onload = () => {
            if (!picture.naturalWidth || !picture.naturalHeight) return reject(new Error("The selected image is invalid."));
            const scale = Math.min(1, 512 / Math.max(picture.naturalWidth, picture.naturalHeight));
            const canvas = document.createElement("canvas");
            canvas.width = Math.max(1, Math.round(picture.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(picture.naturalHeight * scale));
            const context = canvas.getContext("2d");
            if (!context) return reject(new Error("Your browser could not prepare this image."));
            context.drawImage(picture,0,0,canvas.width,canvas.height);
            resolve(canvas.toDataURL("image/jpeg",0.86));
          };
          picture.src = String(reader.result || "");
        };
        reader.readAsDataURL(file);
      });
      const r = await fetch("/api/account/avatar", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image})});
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not upload profile picture.");
      onUpdated({user:d.user,access:d.access});
      setAvatarNotice(d.message || "Profile picture updated successfully.");
    } catch(err) { setAvatarError(err.message || "Could not upload profile picture."); }
    finally { setAvatarSaving(false); input.value = ""; }
  };
  const removeAvatar = async () => {
    if (!user?.has_avatar || avatarSaving) return;
    setAvatarSaving(true); setAvatarError(""); setAvatarNotice(""); setNotice(""); setError("");
    try {
      const r = await fetch("/api/account/avatar", {method:"DELETE"});
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not remove profile picture.");
      onUpdated({user:d.user,access:d.access});
      setAvatarNotice(d.message || "Profile picture removed.");
    } catch(err) { setAvatarError(err.message || "Could not remove profile picture."); }
    finally { setAvatarSaving(false); }
  };
  const submit = async e => {
    e.preventDefault(); setNotice(""); setError("");
    if (newPassword && newPassword !== confirmPassword) { setError("The new password and confirmation do not match."); return; }
    if (username.trim() === (user?.username || "") && !newPassword) { setError("Enter a new username or a new password before saving."); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/account/profile", {method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:username.trim(),currentPassword,newPassword})});
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed to update your account.");
      onUpdated({user:d.user,access:d.access});
      setUsername(d.user.username); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setNotice(d.message || "Account updated successfully.");
    } catch(e) { setError(e.message || "Failed to update your account."); }
    finally { setSaving(false); }
  };
  return <section className="module-page profile-page">
    <div className="module-heading"><span className="module-icon mint"><Users size={24}/></span><div><small>ACCOUNT / SECURITY</small><h2>My Profile</h2><p>Update your own username and password. This page is available to every role.</p></div></div>
    {notice && <div className="notice profile-success"><ShieldCheck size={18}/><div><b>{notice}</b></div></div>}
    {error && <div className="auth-error">{error}</div>}
    {avatarNotice && <div className="notice profile-success"><ShieldCheck size={18}/><div><b>{avatarNotice}</b></div></div>}
    {avatarError && <div className="auth-error">{avatarError}</div>}
    <div className="profile-layout">
      <section className="panel profile-summary"><UserAvatar username={user?.username} hasAvatar={user?.has_avatar} avatarUpdatedAt={user?.avatar_updated_at} className="profile-summary-avatar"/><h3>{user?.username}</h3>
        <input ref={avatarInputRef} className="avatar-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarFile} aria-label="Choose profile picture"/>
        <div className="avatar-actions"><button type="button" className="secondary-button avatar-upload-button" onClick={()=>avatarInputRef.current?.click()} disabled={avatarSaving}>{avatarSaving ? <><span className="loading-dot"/> Saving...</> : <><ImagePlus size={14}/> {user?.has_avatar ? "Change picture" : "Upload picture"}</>}</button>{user?.has_avatar ? <button type="button" className="avatar-remove-button" onClick={removeAvatar} disabled={avatarSaving} title="Remove profile picture"><Trash2 size={14}/></button> : null}</div>
        <small className="avatar-help">JPG, PNG or WebP. Automatically resized to fit within 512 × 512.</small><span className={"role-chip role-chip-"+(user?.role || "user")}>{user?.role_name || (user?.role === "admin" ? "Admin" : user?.role === "manager" ? "Manager" : user?.role === "user" ? "User" : user?.role)}</span><p>Your account role and permissions are managed separately from your personal sign-in details.</p><div className="profile-summary-divider"/><div className="profile-summary-row"><span>Account ID</span><b>{user?.id}</b></div><div className="profile-summary-row"><span>Access level</span><b>{user?.role === "admin" ? "System administrator" : user?.role === "manager" ? "Project manager" : user?.role_name || "Standard user"}</b></div></section>
      <section className="panel profile-form-panel"><div className="panel-heading"><div><h3>Account settings</h3><p>Confirm your current password to save changes.</p></div></div>
        <form className="profile-form" onSubmit={submit}>
          <label className="field">Username<input required minLength={3} maxLength={40} pattern="[a-zA-Z0-9._-]+" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/><small>3-40 characters. Letters, numbers, periods, hyphens and underscores only.</small></label>
          <div className="profile-form-divider"><span>CHANGE PASSWORD</span><small>Leave the new password fields empty to keep your current password.</small></div>
          <label className="field">New password<input type="password" minLength={12} maxLength={128} value={newPassword} onChange={e=>setNewPassword(e.target.value)} autoComplete="new-password" placeholder="Enter a new password (optional)"/></label>
          {newPassword && <div className="password-policy profile-password-policy" aria-live="polite"><p>Password policy</p>{passwordRules.map(([valid,label])=><div className={valid ? "password-rule valid" : "password-rule"} key={label}><span>{valid ? "✓" : "○"}</span>{label}</div>)}</div>}
          <label className="field">Confirm new password<input type="password" minLength={12} maxLength={128} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} autoComplete="new-password" placeholder="Re-enter new password"/></label>
          <label className="field current-password-field">Current password <span className="required-mark">Required</span><input type="password" required value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} autoComplete="current-password" placeholder="Verify it is you"/></label>
          <div className="modal-note"><LockKeyhole size={14}/> Passwords are never displayed or written to audit logs. Changing your password will sign out other active sessions.</div>
          <div className="profile-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? <><span className="loading-dot"/> Saving changes...</> : <><ShieldCheck size={15}/> Save changes</>}</button></div>
        </form>
      </section>
    </div>
  </section>;
}

function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    fetch("/api/audit-log").then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error || "Failed to load audit logs."); return d; })
      .then(d => { if (alive) setLogs(Array.isArray(d.logs) ? d.logs : []); })
      .catch(e => { if (alive) setError(e.message || "Failed to load audit logs."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const actionNames = {LOGIN:"Signed in", LOGOUT:"Signed out", LOGIN_FAILED:"Failed sign-in", CREATE:"Created", DELETE:"Deleted", CREATE_ROLE:"Created role", DELETE_ROLE:"Deleted role", UPDATE_ROLE_PERMISSIONS:"Updated role permissions", UPDATE_ACCESS:"Updated access permissions", UPDATE_ROLE:"Changed account role", CHANGE_USERNAME:"Changed username", CHANGE_PASSWORD:"Changed password", CHANGE_AVATAR:"Updated profile picture"};
  const targetName = log => log.action === "LOGIN_FAILED" ? `Login attempt: ${log.entity_id || "unknown username"}` : `${log.entity}${log.entity_id ? " · " + log.entity_id : ""}`;
  return <section className="module-page audit-log-page">
    <div className="module-heading"><span className="module-icon mint"><Activity size={24}/></span><div><small>ADMINISTRATION / SECURITY</small><h2>Audit Logs</h2><p>Review sign-ins, project changes, account changes, and access updates.</p></div></div>
    {error && <div className="auth-error">{error}</div>}
    <section className="panel"><div className="panel-heading"><div><h3>Activity history</h3><p>Showing the latest {logs.length} recorded events, up to 500 entries.</p></div><span className="audit-count">{logs.length} events</span></div>
      {loading ? <div className="empty-state"><span className="loading-dot"/><b>Loading audit logs...</b></div> : logs.length === 0 ? <div className="empty-state"><Activity size={22}/><b>No audit events yet</b><span>Sign-ins and system changes will be recorded here.</span></div> : <div className="table-scroll audit-table-wrap"><table className="audit-table"><thead><tr><th>TIME (UTC)</th><th>USER</th><th>EVENT</th><th>TARGET</th></tr></thead><tbody>{logs.map(log => <tr key={log.id}><td className="audit-time">{log.created_at}</td><td><div className="audit-user"><b>{log.username || "Unknown user"}</b><small>{log.role === "admin" ? "Admin" : log.role === "manager" ? "Manager" : log.role === "user" ? "User" : log.role}</small></div></td><td><span className={"audit-action " + (log.action === "LOGIN_FAILED" ? "audit-action-danger" : "")}>{actionNames[log.action] || log.action}</span></td><td>{targetName(log)}</td></tr>)}</tbody></table></div>}
    </section>
  </section>;
}

function App({ user, onLogout, onUserUpdated }) {
  const allowedPages = user?.access?.pages || [];
  const currentDate = new Date();
  const greeting = currentDate.getHours() < 12 ? "Good morning" : currentDate.getHours() < 18 ? "Good afternoon" : "Good evening";
  const todayLabel = currentDate.toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
  const [active, setActive] = useState(allowedPages.includes("Dashboard") ? "Dashboard" : (allowedPages[0] || "Dashboard"));
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [dbError, setDbError] = useState("");
  useEffect(() => { if (!allowedPages.includes("Dashboard") && !allowedPages.includes("Projects")) { setProjects([]); setProjectsLoading(false); return; } let alive = true; fetch("/api/projects").then(async r => { if (!r.ok) throw new Error("Failed to load data from the database."); return r.json(); }).then(data => { if (alive) setProjects(Array.isArray(data.projects) ? data.projects : []); }).catch(err => { if (alive) setDbError(err.message); }).finally(() => { if (alive) setProjectsLoading(false); }); return () => { alive = false; }; }, [user?.id, allowedPages.join("|")]);
  const visibleProjects = useMemo(() => projects.filter(p => [p.name,p.client,p.id,p.stage,p.owner].join(" ").toLowerCase().includes(search.toLowerCase())), [projects, search]);
  const navigate = name => { if (allowedPages.includes(name)) setActive(name); setMobileOpen(false); };
  const saveProject = async data => { try { const response = await fetch("/api/projects", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data)}); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Failed to save project."); setProjects(prev => [result.project, ...prev]); setActive("Projects"); setSearch(""); setDbError(""); } catch (err) { alert(err.message || "Unable to save data."); } };
  const subtitle = active === "Dashboard" ? "Your team's security engagements, at a glance." : active === "Projects" ? "Track every client engagement from intake to close-out." : active === "My Profile" ? "Manage your sign-in details and account security." : active === "Audit Logs" ? "Review account activity and important security events." : active === "AI Assistant" ? "Security guidance for authorized assessment work." : (workflow.find(w => w.name === active)?.desc || "Workspace preferences and access configuration.");
  useEffect(() => { if (!allowedPages.includes(active)) setActive(allowedPages[0] || "Dashboard"); }, [active, user?.id]);
  return <div className="app-shell"><Sidebar active={active} navigate={navigate} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} username={user?.username} role={user?.role} roleName={user?.role_name} hasAvatar={user?.has_avatar} avatarUpdatedAt={user?.avatar_updated_at} allowedPages={allowedPages}/><main className="main-area">
    <Topbar title={active} subtitle={subtitle} search={search} setSearch={setSearch} navigate={navigate} onCreate={() => setShowModal(true)} canCreate={active === "Projects" && allowedPages.includes("Projects") && !!user?.access?.canCreateProjects} onMobileMenu={() => setMobileOpen(true)} onLogout={onLogout} username={user?.username} hasAvatar={user?.has_avatar} avatarUpdatedAt={user?.avatar_updated_at}/>
    {dbError && <div className="db-warning"><LockKeyhole size={14}/>{dbError}</div>}
    <div className="content">
      {active === "My Profile" ? <MyProfilePage user={user} onUpdated={onUserUpdated}/> : active === "Settings" && (allowedPages.includes("Settings")) ? <AdminAccessPage currentUserId={user?.id} role={user?.role}/> : active === "Audit Logs" && user?.access?.pages?.includes("Audit Logs") ? <AuditLogPage /> : active === "AI Assistant" && allowedPages.includes("AI Assistant") ? <AIAssistantPage /> : active === "Dashboard" ? <>
        <div className="welcome-row"><div><div className="eyebrow-line"><i/> INTERNAL WORKSPACE <span>/</span> {todayLabel}</div><h2>{greeting}, {user?.username || "there"} <span>✳</span></h2><p>Here's what's happening across your engagements today.</p></div><button className="outline-button" onClick={() => navigate("Projects")}><Activity size={15}/> View all projects <ChevronRight size={14}/></button></div>
        <div className="stats-grid"><StatCard label="Active projects" value="—" change="No data" note="Awaiting project records" icon={BriefcaseBusiness} tone="mint"/><StatCard label="Tasks in progress" value="—" change="No data" note="Awaiting task workflow" icon={Zap} tone="blue"/><StatCard label="Pending reviews" value="—" change="No data" note="Awaiting review records" icon={Clock3} tone="amber" caution/><StatCard label="Completed this month" value="—" change="No data" note="Awaiting completed records" icon={ShieldCheck} tone="violet"/></div>
        <div className="section-title"><div><h3>SC Workflow</h3><p>Your eight core delivery modules</p></div><button className="text-button" onClick={() => navigate("Projects")}>View projects <ArrowUpRight size={14}/></button></div>
        <WorkflowGrid navigate={navigate} allowedPages={allowedPages}/>
        <div className="dashboard-columns"><section className="panel projects-panel"><div className="panel-heading"><div><h3>Project workspace</h3><p>Project records will appear here when created and assigned.</p></div><button className="text-button" onClick={() => navigate("Projects")}>Open projects <ChevronRight size={14}/></button></div><ProjectTable projects={visibleProjects.slice(0,4)} onOpen={setSelectedProject} loading={projectsLoading}/><div className="panel-footer"><span><b>{projects.length}</b> project records</span><button className="text-button" onClick={() => navigate("Projects")}>Open project tracker <ArrowUpRight size={14}/></button></div></section>
          <div className="right-column"><section className="panel"><div className="panel-heading"><div><h3>Tasks</h3><p>Task workflow foundation</p></div></div><div className="empty-state"><ClipboardCheck size={22}/><b>No tasks yet</b><span>Tasks will appear after the workflow is connected.</span></div></section>
            <section className="panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Audit trail foundation</p></div></div><div className="empty-state"><Activity size={22}/><b>No activity yet</b><span>Recorded events will appear here.</span></div></section>
          </div>
        </div>
      </> : active === "Projects" ? <>
        <div className="welcome-row projects-welcome"><div><div className="eyebrow-line"><i/> ENGAGEMENT TRACKER</div><h2>Projects</h2><p>Manage engagements across all eight SC workflow stages.</p></div>{allowedPages.includes("Projects") && user?.access?.canCreateProjects && <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={15}/> New project</button>}</div>
        <div className="stats-grid compact-stats"><StatCard label="Total projects" value={String(projects.length).padStart(2,"0")} change="All stages" note="in this workspace" icon={BriefcaseBusiness} tone="mint"/><StatCard label="In progress" value={String(projects.filter(p => p.status === "In progress").length).padStart(2,"0")} change="Active" note="currently underway" icon={Activity} tone="blue"/><StatCard label="In review" value={String(projects.filter(p => p.status === "Review").length).padStart(2,"0")} change="Attention" note="awaiting review" icon={Clock3} tone="amber" caution/><StatCard label="Planning" value={String(projects.filter(p => p.status === "Planning").length).padStart(2,"0")} change="Upcoming" note="not yet underway" icon={CalendarDays} tone="violet"/></div>
        <section className="panel all-projects"><div className="panel-heading"><div><h3>All engagements</h3><p>Search project name, client, ID or workflow stage.</p></div><label className="table-search"><Search size={14}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Filter projects"/></label></div><ProjectTable projects={visibleProjects} onOpen={setSelectedProject} loading={projectsLoading}/></section>
      </> : active === "Mainload" ? <PlanningWorkspace mode="setup" userId={user?.id} userRole={user?.role} allowedPages={allowedPages} navigate={navigate}/> : active === "Proposal" ? <PlanningWorkspace mode="proposal" userId={user?.id} userRole={user?.role} allowedPages={allowedPages} navigate={navigate}/> : active === "Kick-off" ? <PlanningWorkspace mode="kickoff" userId={user?.id} userRole={user?.role} allowedPages={allowedPages} navigate={navigate}/> : active === "Audit Report" && allowedPages.includes("Audit Report") ? <><AuditWorkspace userId={user?.id} userRole={user?.role} /><ProjectDocumentsWorkspace mode="report" userId={user?.id} userRole={user?.role}/></> : active === "Audit Checklist" ? <ProjectDocumentsWorkspace mode="audit" userId={user?.id} userRole={user?.role}/> : active === "Close Meeting" ? <ProjectDocumentsWorkspace mode="close" userId={user?.id} userRole={user?.role}/> : active === "Policy" ? <ProjectDocumentsWorkspace mode="policy" userId={user?.id} userRole={user?.role}/> : <ModulePage name={active} />}
    </div>
    <footer className="app-footer"><span>SC CONTROL CENTER <b>·</b> UI PROTOTYPE 0.1.0</span><span><i/> Development environment <b>|</b> Built for internal use</span></footer>
  </main>
  {showModal && <ProjectModal onClose={() => setShowModal(false)} onSave={saveProject}/>}
  {selectedProject && <ProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)}/>}
  </div>;
}

function Root() {
  const [session, setSession] = useState(null);
  const [authKey, setAuthKey] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {method:"POST"});
      if (!response.ok) throw new Error("Sign out failed. Please try again.");
      setSession(null);
      setAuthKey(v => v + 1);
      setShowLogoutConfirm(false);
      window.location.reload();
    } catch (error) {
      window.alert(error.message || "Sign out failed. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };
  return <>
    <AuthGate key={authKey} onAuthenticated={setSession}>{session ? <App user={{...session.user,access:session.access}} onLogout={() => setShowLogoutConfirm(true)} onUserUpdated={setSession}/> : <SessionApp onSession={setSession}/>}</AuthGate>
    {showLogoutConfirm && session && <div className="modal-backdrop logout-confirm-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!loggingOut)setShowLogoutConfirm(false)}}><section className="modal logout-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title"><div className="logout-confirm-icon"><LogOut size={22}/></div><div className="modal-heading logout-confirm-heading"><div><small>SC CONTROL CENTER</small><h2 id="logout-confirm-title">Sign out</h2><p>Are you sure you want to sign out?</p></div><button type="button" className="icon-button" aria-label="Cancel sign out" disabled={loggingOut} onClick={()=>setShowLogoutConfirm(false)}><X size={17}/></button></div><div className="modal-actions"><button type="button" className="secondary-button" disabled={loggingOut} onClick={()=>setShowLogoutConfirm(false)}>Cancel</button><button type="button" className="primary-button logout-confirm-button" disabled={loggingOut} onClick={logout}><LogOut size={15}/>{loggingOut?"Signing out…":"Sign out"}</button></div></section></div>}
  </>;
}
function SessionApp({ onSession }) {
  useEffect(() => { fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(data => data?.user && onSession(data)).catch(() => {}); }, []);
  return null;
}
createRoot(document.getElementById("root")).render(<Root />);

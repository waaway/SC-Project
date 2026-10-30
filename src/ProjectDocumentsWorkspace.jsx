import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDownToLine, Check, CheckCircle2, FileCheck2, FileText, LoaderCircle, Plus, RefreshCw, Save, ShieldCheck, Upload, X } from "lucide-react";
import { masterTemplateFields } from "../shared/masterTemplateFields.js";
import "./project-documents.css";

const categoryTitles = {
  mainload: "Mainload Source Documents",
  proposal: "Proposal Source Documents",
  kickoff: "Kick-off Source Documents",
  audit: "Audit Plan, Checklist & Notes",
  report: "Audit Report & CAR Sources",
  close: "Close Meeting Summary",
  policy: "Policy & Procedure"
};
const categoryTypes = {
  mainload: ["manload"],
  proposal: ["proposal", "org_chart", "timeline", "team_profile"],
  kickoff: ["kickoff"],
  audit: ["audit_plan", "audit_checklist", "audit_note"],
  report: ["audit_report", "car_form"],
  close: ["close_meeting"],
  policy: ["isms_manual", "policy", "procedure", "user_access_procedure"]
};
const labels = {
  manload: "Manload",
  proposal: "Technical Proposal",
  org_chart: "Organization Chart",
  timeline: "Project Timeline",
  team_profile: "Team Profile",
  kickoff: "Kickoff Presentation",
  audit_plan: "Audit Plan",
  audit_checklist: "Audit Checklist",
  audit_note: "Audit Note",
  audit_report: "Audit Report",
  car_form: "Corrective Action Request Form",
  close_meeting: "Close Meeting Slide - Audit Summary",
  isms_manual: "ISMS Manual",
  policy: "IT Security Policy",
  procedure: "Internal Audit Procedure",
  user_access_procedure: "User Access Management Procedure"
};
const exportFormats = {
  audit_plan: "docx",
  audit_checklist: "xlsx",
  audit_note: "docx",
  audit_report: "docx",
  car_form: "xlsx",
  isms_manual: "docx",
  policy: "docx",
  procedure: "docx",
  user_access_procedure: "docx",
  close_meeting: "pptx"
};
const masterTemplateKeyByType = {
  isms_manual: "isms_manual",
  policy: "security_policy",
  procedure: "internal_audit_procedure",
  user_access_procedure: "user_access_procedure"
};
const documentControlFields = [
  ["documentCode", "Document code", false], ["revision", "Revision", false], ["effectiveDate", "Effective date", false],
  ["reviewDate", "Next review date", false], ["classification", "Classification", false],
  ["preparedBy", "Prepared by", false], ["preparedDate", "Prepared date", false],
  ["reviewedBy", "Reviewed by", false], ["reviewedDate", "Review date", false],
  ["approvedBy", "Approved by", false], ["approvedDate", "Approval date", false]
];
const formFields = {
  audit_plan: [
    ...documentControlFields,
    ["standard", "Audit standard", false], ["objective", "Audit objective", true], ["scope", "Scope", true],
    ["criteria", "Audit criteria", true], ["method", "Audit method", true], ["locations", "Locations", false],
    ["auditDates", "Audit dates", false], ["auditTeam", "Audit team and roles", true], ["auditeeContact", "Auditee contact / department", true], ["agenda", "Schedule and agenda", true],
    ["risks", "Risks and dependencies", true], ["references", "References and source documents", true]
  ],
  audit_report: [
    ...documentControlFields,
    ["standard", "Audit standard", false], ["objective", "Audit objective", true], ["scope", "Audit scope", true],
    ["criteria", "Audit criteria", true], ["method", "Audit approach", true], ["auditDates", "Audit dates", false], ["locations", "Audit locations", true],
    ["auditTeam", "Audit team and roles", true], ["auditeeContact", "Auditee and contacts", true], ["findingsSummary", "Findings and classification summary", true],
    ["findingDetails", "Finding details / references", true],
    ["conclusion", "Conclusion", true], ["recommendations", "Recommendations", true], ["reviewerChecklist", "Reviewer checklist", true],
    ["references", "References and evidence sources", true]
  ],
  car_form: [
    ["documentCode", "CAR / report number", false], ["revision", "Revision", false], ["issueDate", "Issue date", false],
    ["preparedBy", "Prepared by", false], ["preparedDate", "Prepared date", false], ["reviewedBy", "Reviewed by", false],
    ["reviewedDate", "Review date", false], ["approvedBy", "Approved by", false], ["approvedDate", "Approval date", false],
    ["controlReference", "Control or clause", false], ["classification", "Classification", false], ["department", "Department", false],
    ["findingTitle", "Finding title", true], ["evidence", "Objective evidence / finding description", true], ["evidenceSource", "Evidence source", true],
    ["impact", "Impact", true], ["rootCause", "Root cause", true], ["correction", "Correction", true],
    ["correctiveAction", "Corrective action plan", true], ["actionOwner", "Responsible person", false], ["dueDate", "Planned implementation date", false],
    ["actualImplementationDate", "Actual implementation date", false], ["implementationEvidence", "Implementation evidence", true],
    ["concernedManager", "Concerned department manager", false], ["effectivenessCheck", "Effectiveness check and closure", true], ["effectivenessDate", "Verification date", false]
  ],
  audit_checklist: [
    ...documentControlFields,
    ["standard", "Audit standard", false], ["scope", "Scope", true], ["locations", "Audit location", false], ["auditeeContact", "Auditee / department", true],
    ["auditDates", "Audit dates", false], ["checklistItems", "Checklist rows", true, "One row per line: control | requirement | question | expected evidence | result | auditor note"],
    ["references", "References and source documents", true]
  ],
  audit_note: [
    ...documentControlFields,
    ["sessionDate", "Session date and time", false], ["session", "Session or process", false],
    ["department", "Department / auditee", false], ["participants", "Participants and roles", true],
    ["controlReference", "Control or requirement reference", false], ["evidence", "Evidence reviewed", true],
    ["observations", "Auditor notes and observations", true], ["openQuestions", "Open questions", true],
    ["followUp", "Follow-up actions", true]
  ],
  close_meeting: [
    ...documentControlFields,
    ["meetingDate", "Meeting date", false], ["engagement", "Engagement and attendees", true],
    ["objective", "Audit objective", true], ["scope", "Audit scope", true], ["resultsSummary", "Audit summary", true],
    ["findingsSummary", "Confirmed findings and classification counts", true], ["decisions", "Decisions and open items", true],
    ["nextSteps", "Next steps", true], ["ownersAndDates", "Owners and due dates", true]
  ]
};

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function blankFields(type) {
  const values = Object.fromEntries((formFields[type] || []).map(([key]) => [key, ""]));
  const template = masterTemplateFields[masterTemplateKeyByType[type]];
  if (template) values.templateValues = Object.fromEntries(template.tokens.map(item => [item.token, ""]));
  return values;
}

async function fileToBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function useProjectDocuments(category, projectId) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const requestSequence = useRef(0);
  const requestKey = `${category}:${projectId || ""}`;
  const activeKey = useRef(requestKey);
  activeKey.current = requestKey;
  const reload = async () => {
    const sequence = ++requestSequence.current;
    if (!projectId) { setDocuments([]); setError(""); setLoadedKey(requestKey); setLoading(false); return; }
    setLoading(true);
    setError("");
    try {
      const data = await readResponse(await fetch(`/api/project-documents/projects/${encodeURIComponent(projectId)}?category=${encodeURIComponent(category)}`));
      if (sequence === requestSequence.current) { setDocuments(Array.isArray(data.documents) ? data.documents : []); setLoadedKey(requestKey); }
    } catch (e) { if (sequence === requestSequence.current) { setDocuments([]); setError(e.message); setLoadedKey(requestKey); } }
    finally { if (sequence === requestSequence.current) setLoading(false); }
  };
  useEffect(() => { reload(); return () => { requestSequence.current++; }; }, [category, projectId]);
  const currentDocuments = loadedKey === requestKey ? documents : [];
  const updateDocuments = (expectedProjectId, updater) => {
    if (activeKey.current !== `${category}:${expectedProjectId || ""}`) return;
    setDocuments(updater);
  };
  return { documents: currentDocuments, updateDocuments, loading: loading || Boolean(projectId && loadedKey !== requestKey), error: loadedKey === requestKey ? error : "", reload };
}

function ImportSourcePanel({ category, project, onImported }) {
  const types = categoryTypes[category] || [];
  const [documentType, setDocumentType] = useState(types[0] || "");
  const [file, setFile] = useState(null);
  const [confirmProjectId, setConfirmProjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { setDocumentType(types[0] || ""); setFile(null); setConfirmProjectId(""); setError(""); setNotice(""); }, [category, project?.id]);

  const importFile = async e => {
    e.preventDefault();
    if (!project || !file || busy || confirmProjectId !== project.id) return;
    setBusy(true); setError(""); setNotice("");
    try {
      if (file.size > 12 * 1024 * 1024) throw new Error("Files must be 12 MB or smaller.");
      const fileBase64 = await fileToBase64(file);
      const data = await readResponse(await fetch(`/api/project-documents/projects/${encodeURIComponent(project.id)}/import`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, documentType, filename: file.name, fileBase64, confirmProjectId })
      }));
      setFile(null);
      const input = e.currentTarget.querySelector('input[type="file"]');
      if (input) input.value = "";
      onImported?.(data.document);
      const suggestion = data.suggestedType && data.suggestedType !== documentType ? ` Filename suggests ${labels[data.suggestedType] || data.suggestedType}; check the selected type.` : "";
      const scanMessage = data.extraction?.scanned ? " No selectable text was found; this file needs OCR before its content can be used." : "";
      setNotice(`${labels[documentType]} source saved to ${project.id}.${suggestion}${scanMessage}`);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (!project) return null;
  return <section className="panel project-doc-panel project-doc-import">
    <div className="panel-heading"><div><h3>Import and read a source file</h3><p>Extraction runs locally on this server. The file and extracted text stay with this project and are not sent to AI.</p></div><Upload size={18}/></div>
    {error && <div className="auth-error project-doc-alert"><AlertCircle size={15}/><span>{error}</span></div>}
    {notice && <div className="project-doc-success"><CheckCircle2 size={15}/><span>{notice}</span></div>}
    <form className="project-doc-form" onSubmit={importFile}>
      <div className="project-doc-target"><ShieldCheck size={17}/><div><b>{project.name} · {project.client}</b><span>Files are stored only under project {project.id}. A file that identifies another accessible project is rejected.</span></div></div>
      <div className="project-doc-grid two">
        <label className="project-doc-field">Document type<select value={documentType} onChange={e => setDocumentType(e.target.value)}>{types.map(type => <option key={type} value={type}>{labels[type]}</option>)}</select></label>
        <label className="project-doc-field">Source file<input required type="file" accept=".docx,.xlsx,.pptx,.pdf" onChange={e => setFile(e.target.files?.[0] || null)}/><small>DOCX, XLSX, PPTX or text-based PDF · max 12 MB</small></label>
      </div>
      <div className="project-doc-grid two project-doc-confirm-grid"><label className="project-doc-field">Type project ID to confirm this destination<input value={confirmProjectId} onChange={e => setConfirmProjectId(e.target.value)} placeholder={project.id} autoComplete="off" spellCheck="false"/></label><div className="project-doc-confirm-note">Selected client: <b>{project.client}</b><br/>Selected project: <b>{project.id}</b></div></div>
      <div className="project-doc-actions"><button className="primary-button" type="submit" disabled={busy || !file || confirmProjectId !== project.id}><Upload size={14}/>{busy ? "Reading and saving..." : "Read and import"}</button><span>Imported source files begin as unreviewed records.</span></div>
    </form>
  </section>;
}

function DocumentCard({ document, project, userRole, userId, onUpdated, onEdit }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canReview = ["admin", "manager", "reviewer"].includes(userRole);
  const fields = useMemo(() => {
    try { return document.content_json ? JSON.parse(document.content_json) : {}; }
    catch { return {}; }
  }, [document.content_json]);
  const canEdit = document.origin === "draft" && document.review_status !== "Issued" && (document.created_by === userId || canReview);

  const download = async endpoint => {
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error || "Download failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = endpoint.includes("/source") ? document.source_filename : `${project.id}-${document.document_type}-${document.id}.${exportFormats[document.document_type]}`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  const changeStatus = async reviewStatus => {
    setBusy(true); setError("");
    try {
      const data = await readResponse(await fetch(`/api/project-documents/${document.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus }) }));
      onUpdated(data.document);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return <article className="project-document-card">
    <div className="project-document-card-head"><div><small>{labels[document.document_type] || document.document_type} · {document.origin === "imported" ? document.source_filename : new Date(document.created_at + "Z").toLocaleString()}</small><h4>{document.title}</h4></div><span className={`project-doc-state ${document.review_status === "Issued" || document.review_status === "Reviewed" ? "approved" : "pending"}`}>{document.review_status}</span></div>
    {error && <div className="auth-error project-doc-alert"><AlertCircle size={14}/><span>{error}</span></div>}
    {document.origin === "imported" ? <>
      <div className="project-doc-file-meta">{(document.file_size / 1024 / 1024).toFixed(document.file_size < 1024 * 1024 ? 2 : 1)} MB · SHA-256 {document.sha256?.slice(0, 16)}… · {document.source_filename?.split(".").pop()?.toUpperCase()}</div>
      {document.extraction_status === "needs_ocr" && <div className="project-doc-extraction-warning"><AlertCircle size={14}/>This file appears scanned or contains too little selectable text. Run OCR before relying on its content.</div>}
      {document.extraction_status === "truncated" && <div className="project-doc-extraction-warning"><AlertCircle size={14}/>Extraction reached the safe text limit. Treat this as a partial extract and split the source before using it.</div>}
      <details className="project-doc-preview"><summary>View extracted text</summary>{document.extracted_text ? <pre>{document.extracted_text.slice(0, 50000)}{document.extracted_text.length > 50000 ? "\n\n[Preview clipped to 50,000 characters. Stored extraction is capped at 180,000 characters.]" : ""}</pre> : <div className="project-doc-empty-text"><AlertCircle size={15}/>No selectable text was extracted. This may be a scanned PDF; run OCR before using it as source content.</div>}</details>
      <div className="project-doc-actions"><button className="secondary-button" onClick={() => download(`/api/project-documents/${document.id}/source`)} disabled={busy}><ArrowDownToLine size={14}/> Download source</button>{canReview && document.review_status === "Imported" && <button className="secondary-button" onClick={() => changeStatus("Reviewed")} disabled={busy}><CheckCircle2 size={14}/> Mark source reviewed</button>}</div>
    </> : <>
      <pre className="project-doc-draft-preview">{document.content_markdown}</pre>
      {document.source_document_id && <small className="project-doc-provenance">Linked to source document #{document.source_document_id} in this project.</small>}
      <div className="project-doc-actions"><button className="secondary-button" onClick={() => download(`/api/project-documents/${document.id}/export/${exportFormats[document.document_type]}`)} disabled={busy}><ArrowDownToLine size={14}/> Export .{exportFormats[document.document_type]}</button>{canEdit && <button className="secondary-button" onClick={() => onEdit(document, fields)}><FileText size={14}/> Edit draft</button>}{canReview && document.review_status === "Draft" && <button className="secondary-button" onClick={() => changeStatus("Reviewed")} disabled={busy}><CheckCircle2 size={14}/> Mark reviewed</button>}{canReview && document.review_status === "Reviewed" && <button className="primary-button" onClick={() => changeStatus("Issued")} disabled={busy}><Check size={14}/> Issue document</button>}</div>
    </>}
  </article>;
}

export function ProjectDocumentSources({ category, project, userRole, userId }) {
  const { documents, updateDocuments, loading, error, reload } = useProjectDocuments(category, project?.id);
  const sourceDocs = documents.filter(document => document.origin === "imported");
  if (!project) return null;
  return <section className="project-documents-workspace">
    <ImportSourcePanel category={category} project={project} onImported={document => { if (document.project_id === project.id) updateDocuments(project.id, current => [document, ...current]); }}/>
    <section className="panel project-doc-panel">
      <div className="panel-heading"><div><h3>Imported source files</h3><p>Source files are restricted to this selected project.</p></div><div className="project-doc-heading-actions"><span className="planning-count">{sourceDocs.length} files</span><button className="secondary-button" onClick={reload} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></div>
      {error && <div className="auth-error project-doc-alert"><AlertCircle size={15}/><span>{error}</span></div>}
      {loading ? <div className="empty-state"><LoaderCircle className="spin" size={20}/><b>Loading project sources...</b></div> : !sourceDocs.length ? <div className="empty-state"><FileText size={22}/><b>No source files imported</b><span>Choose a file, confirm the project ID and import it to this project.</span></div> : <div className="project-doc-list">{sourceDocs.map(document => <DocumentCard key={document.id} document={document} project={project} userRole={userRole} userId={userId} onUpdated={updated => updateDocuments(project.id, current => current.map(item => item.id === updated.id ? updated : item))}/>)}</div>}
    </section>
  </section>;
}

export default function ProjectDocumentsWorkspace({ mode, userRole, userId }) {
  const category = mode;
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [documentType, setDocumentType] = useState((categoryTypes[category] || [])[0] || "");
  const [fields, setFields] = useState(blankFields((categoryTypes[category] || [])[0] || ""));
  const [confirmProjectId, setConfirmProjectId] = useState("");
  const [editingDocumentId, setEditingDocumentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const { documents, updateDocuments, loading, error, reload } = useProjectDocuments(category, projectId);
  const canReview = ["admin", "manager", "reviewer"].includes(userRole);
  const project = useMemo(() => projects.find(row => row.id === projectId) || null, [projects, projectId]);

  useEffect(() => {
    let alive = true;
    fetch(`/api/project-documents/projects?category=${encodeURIComponent(category)}`).then(readResponse).then(data => {
      if (!alive) return;
      const rows = Array.isArray(data.projects) ? data.projects : [];
      setProjects(rows);
      if (rows.length) setProjectId(rows[0].id);
    }).catch(e => { if (alive) setPageError(e.message); }).finally(() => { if (alive) setLoadingProjects(false); });
    return () => { alive = false; };
  }, [category]);
  useEffect(() => {
    setConfirmProjectId("");
    setEditingDocumentId(null);
    setDocumentType((categoryTypes[category] || [])[0] || "");
    setFields(blankFields((categoryTypes[category] || [])[0] || ""));
  }, [category]);

  const editableTypes = useMemo(() => (categoryTypes[category] || []).filter(type => !["manload","proposal","org_chart","timeline","team_profile","kickoff"].includes(type)), [category]);
  const importedSources = documents.filter(document => document.origin === "imported");
  const savedDrafts = documents.filter(document => document.origin === "draft");
  const selectType = type => { setDocumentType(type); setFields(blankFields(type)); setEditingDocumentId(null); setNotice(""); };

  const saveDraft = async e => {
    e.preventDefault();
    if (!project || saving || confirmProjectId !== project.id) return;
    setSaving(true); setPageError(""); setNotice("");
    try {
      const endpoint = editingDocumentId ? `/api/project-documents/${editingDocumentId}` : `/api/project-documents/projects/${encodeURIComponent(project.id)}/drafts`;
      const method = editingDocumentId ? "PATCH" : "POST";
      const data = await readResponse(await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, documentType, fields, confirmProjectId }) }));
      if (data.document.project_id === project.id) {
        if (editingDocumentId) updateDocuments(project.id, current => current.map(document => document.id === data.document.id ? data.document : document));
        else updateDocuments(project.id, current => [data.document, ...current]);
      }
      setFields(blankFields(documentType)); setEditingDocumentId(null); setConfirmProjectId("");
      setNotice(`${labels[documentType]} draft saved to project ${project.id}.`);
    } catch (e) { setPageError(e.message); }
    finally { setSaving(false); }
  };
  const editDraft = (document, documentFields) => {
    setDocumentType(document.document_type);
    setFields({ ...blankFields(document.document_type), ...documentFields });
    setEditingDocumentId(document.id);
    setConfirmProjectId("");
    setNotice(`Editing ${document.title}. Saving will return it to Draft status.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const updateDocument = updated => { if (updated.project_id === project?.id) updateDocuments(project.id, current => current.map(document => document.id === updated.id ? updated : document)); };
  const selectProject = nextProjectId => {
    setProjectId(nextProjectId);
    setConfirmProjectId("");
    setEditingDocumentId(null);
    setDocumentType((categoryTypes[category] || [])[0] || "");
    setFields(blankFields((categoryTypes[category] || [])[0] || ""));
    setNotice("");
    setPageError("");
  };
  const activeTemplate = masterTemplateFields[masterTemplateKeyByType[documentType]];

  return <section className="module-page project-documents-page">
    <div className="module-heading"><span className="module-icon blue"><FileCheck2 size={24}/></span><div><small>SC WORKFLOW / {category.toUpperCase()}</small><h2>{categoryTitles[category] || "Project Documents"}</h2><p>Read project sources locally, create structured drafts without AI, and export editable Office files.</p></div></div>
    {pageError && <div className="auth-error project-doc-alert"><AlertCircle size={15}/><span>{pageError}</span></div>}
    {notice && <div className="project-doc-success"><CheckCircle2 size={15}/><span>{notice}</span><button className="icon-button" aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={14}/></button></div>}
    {loadingProjects ? <div className="empty-state"><LoaderCircle className="spin" size={21}/><b>Loading accessible projects...</b></div> : !projects.length ? <div className="notice"><ShieldCheck size={18}/><div><b>No accessible projects</b><p>Create a project or ask an administrator to assign your project access first.</p></div></div> : <>
      <div className="project-doc-project-picker panel"><label htmlFor="project-doc-project">Project</label><select id="project-doc-project" value={projectId} onChange={e => selectProject(e.target.value)}>{projects.map(row => <option key={row.id} value={row.id}>{row.name} · {row.client} · {row.id}</option>)}</select><button className="secondary-button" onClick={reload} disabled={loading}><RefreshCw size={14}/> Refresh</button></div>
      {project && <>
        <ImportSourcePanel category={category} project={project} onImported={document => { if (document.project_id === project.id) updateDocuments(project.id, current => [document, ...current]); }}/>
        {editableTypes.length > 0 && <section className="panel project-doc-panel">
          <div className="panel-heading"><div><h3>{editingDocumentId ? "Edit Draft" : "Create a structured draft"}</h3><p>Fields are saved to this project and exported to the format used for this document type. AI is not used.</p></div><FileText size={18}/></div>
          {error && <div className="auth-error project-doc-alert"><AlertCircle size={15}/><span>{error}</span></div>}
          <form className="project-doc-form" onSubmit={saveDraft}>
            <div className="project-doc-grid two"><label className="project-doc-field">Document type<select value={documentType} onChange={e => selectType(e.target.value)}>{editableTypes.map(type => <option key={type} value={type}>{labels[type]}</option>)}</select></label><label className="project-doc-field">Supporting source from this project<select value={fields.sourceDocumentId || ""} onChange={e => setFields(current => ({ ...current, sourceDocumentId: e.target.value }))}><option value="">No source linked</option>{importedSources.map(document => <option key={document.id} value={document.id}>{document.source_filename}</option>)}</select><small>Imported references from other projects are never available here.</small></label></div>
            <div className="project-doc-fields-grid">{(formFields[documentType] || []).map(([key, label, multiline, placeholder]) => <label className={`project-doc-field ${multiline ? "wide" : ""}`} key={key}>{label}{multiline ? <textarea value={fields[key] || ""} onChange={e => setFields(current => ({ ...current, [key]: e.target.value }))} placeholder={placeholder || "Enter verified project information"}/> : <input value={fields[key] || ""} onChange={e => setFields(current => ({ ...current, [key]: e.target.value }))} placeholder="Enter verified project information"/>}{key === "checklistItems" && <small>Columns export to Excel: control, topic, question, evidence, result and auditor notes.</small>}</label>)}</div>
            {activeTemplate && <section className="project-template-inputs">
              <div className="panel-heading"><div><h4>Fields found in the organization template</h4><p>Fill only the placeholders that apply. Blank fields stay visibly marked for completion in the Word file.</p></div></div>
              {activeTemplate.tokens.some(item => item.token === "[LOGO]") && <p className="project-template-note">The logo is an image placeholder. Insert the approved logo in Word after exporting.</p>}
              {[...new Set(activeTemplate.tokens.filter(item => item.token !== "[LOGO]").map(item => item.group))].map(group => {
                const groupFields = activeTemplate.tokens.filter(item => item.group === group && item.token !== "[LOGO]");
                return <details className="project-template-group" key={group}><summary>{group}<span>{groupFields.length} fields</span></summary><div className="project-doc-fields-grid">{groupFields.map(item => <label className={`project-doc-field ${item.multiline ? "wide" : ""}`} key={item.token}>{item.label}{item.multiline ? <textarea value={fields.templateValues?.[item.token] || ""} onChange={e => setFields(current => ({ ...current, templateValues: { ...(current.templateValues || {}), [item.token]: e.target.value } }))} placeholder="Enter approved organization information"/> : <input value={fields.templateValues?.[item.token] || ""} onChange={e => setFields(current => ({ ...current, templateValues: { ...(current.templateValues || {}), [item.token]: e.target.value } }))} placeholder="Enter approved organization information"/>}</label>)}</div></details>;
              })}
            </section>}
            <div className="project-doc-grid two project-doc-confirm-grid"><label className="project-doc-field">Type project ID to confirm this destination<input value={confirmProjectId} onChange={e => setConfirmProjectId(e.target.value)} placeholder={project.id} autoComplete="off" spellCheck="false"/></label><div className="project-doc-confirm-note">Client: <b>{project.client}</b><br/>Project: <b>{project.id}</b></div></div>
            <div className="project-doc-actions"><button className="primary-button" type="submit" disabled={saving || confirmProjectId !== project.id}><Save size={14}/>{saving ? "Saving..." : editingDocumentId ? "Save draft revision" : "Save draft"}</button>{editingDocumentId && <button className="secondary-button" type="button" onClick={() => { setEditingDocumentId(null); setFields(blankFields(documentType)); setConfirmProjectId(""); }}>Cancel edit</button>}<span>{canReview ? "A reviewer must review the draft before it is issued." : "A Reviewer, Manager or Admin must review this draft before issue."}</span></div>
          </form>
        </section>}
        <section className="panel project-doc-panel">
          <div className="panel-heading"><div><h3>Project document register</h3><p>Imported files and drafts visible only in {project.name}.</p></div><div className="project-doc-heading-actions"><span className="planning-count">{documents.length} documents</span><button className="secondary-button" onClick={reload} disabled={loading}><RefreshCw size={14}/> Refresh</button></div></div>
          {error && <div className="auth-error project-doc-alert"><AlertCircle size={15}/><span>{error}</span></div>}
          {loading ? <div className="empty-state"><LoaderCircle className="spin" size={20}/><b>Loading project documents...</b></div> : !documents.length ? <div className="empty-state"><FileText size={22}/><b>No documents yet</b><span>Import a source or save a structured draft for this project.</span></div> : <div className="project-doc-list">{documents.map(document => <DocumentCard key={document.id} document={document} project={project} userRole={userRole} userId={userId} onUpdated={updateDocument} onEdit={editDraft}/>)}</div>}
        </section>
      </>}
    </>}
  </section>;
}

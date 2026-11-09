import React, { useEffect, useState } from "react";
import { AlertCircle, ArrowDownToLine, Check, CheckCircle2, ClipboardList, FileText, LoaderCircle, Plus, RefreshCw, Save, ShieldCheck, Sparkles } from "lucide-react";
import "./audit-workflow.css";

const emptyBrief = {
  standard: "ISO/IEC 27001:2022",
  serviceName: "",
  projectScope: "",
  locations: "",
  auditStart: "",
  auditEnd: "",
  sourceReference: ""
};
const emptyFinding = {
  controlRef: "",
  classification: "OFI",
  department: "",
  title: "",
  evidence: "",
  evidenceSource: "",
  impact: "",
  recommendation: "",
  owner: "",
  dueDate: ""
};
const docLabels = {
  audit_report: "Audit Report",
  close_summary: "Closing Meeting Summary",
  car_register: "CAR Drafts"
};
const documentExportFormats = { audit_report: "docx", close_summary: "pptx", car_register: "xlsx" };

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "The request could not be completed.");
  return data;
}

function Field({ label, value, onChange, required, multiline = false, placeholder = "" }) {
  const Tag = multiline ? "textarea" : "input";
  return <label className="audit-field">{label}{required && <span>Required</span>}<Tag required={required} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/></label>;
}

export default function AuditWorkspace({ userRole, userId }) {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [workspace, setWorkspace] = useState(null);
  const [briefDraft, setBriefDraft] = useState(emptyBrief);
  const [findingDraft, setFindingDraft] = useState(emptyFinding);
  const [editingId, setEditingId] = useState(null);
  const [documentType, setDocumentType] = useState("audit_report");
  const [aiConsent, setAiConsent] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/audit/projects").then(readResponse).then(data => {
      if (!alive) return;
      const rows = Array.isArray(data.projects) ? data.projects : [];
      setProjects(rows);
      if (rows.length) setProjectId(rows[0].id);
    }).catch(e => { if (alive) setError(e.message); }).finally(() => { if (alive) setLoadingProjects(false); });
    return () => { alive = false; };
  }, []);

  const loadWorkspace = async id => {
    if (!id) { setWorkspace(null); return; }
    setLoadingWorkspace(true); setError(""); setNotice(""); setAiConsent(false); setEditingId(null); setFindingDraft(emptyFinding);
    try {
      const data = await readResponse(await fetch(`/api/audit/projects/${encodeURIComponent(id)}`));
      setWorkspace(data);
      const brief = data.brief;
      setBriefDraft(brief ? {
        standard: brief.standard || emptyBrief.standard,
        serviceName: brief.service_name || "",
        projectScope: brief.project_scope || "",
        locations: brief.locations || "",
        auditStart: brief.audit_start || "",
        auditEnd: brief.audit_end || "",
        sourceReference: brief.source_reference || ""
      } : emptyBrief);
    } catch (e) { setError(e.message); setWorkspace(null); }
    finally { setLoadingWorkspace(false); }
  };

  useEffect(() => { loadWorkspace(projectId); }, [projectId]);

  const refresh = () => loadWorkspace(projectId);
  const saveBrief = async e => {
    e.preventDefault(); if (!projectId || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const data = await readResponse(await fetch(`/api/audit/projects/${encodeURIComponent(projectId)}/brief`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(briefDraft)
      }));
      setWorkspace(current => current ? { ...current, brief: data.brief } : current);
      setNotice("Project brief saved. Review the fields, then confirm them for document generation.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const approveBrief = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const data = await readResponse(await fetch(`/api/audit/projects/${encodeURIComponent(projectId)}/brief/approve`, { method: "POST" }));
      setWorkspace(current => current ? { ...current, brief: data.brief } : current);
      setNotice("Project brief confirmed.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const saveFinding = async e => {
    e.preventDefault(); if (!projectId || saving) return;
    setSaving(true); setError(""); setNotice("");
    try {
      const url = editingId ? `/api/audit/findings/${editingId}` : `/api/audit/projects/${encodeURIComponent(projectId)}/findings`;
      const data = await readResponse(await fetch(url, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(findingDraft)
      }));
      setFindingDraft(emptyFinding); setEditingId(null);
      await loadWorkspace(projectId);
      setNotice(editingId ? "Finding updated. Confirm it again before generating a document." : "Finding saved as a draft.");
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const editFinding = finding => {
    setEditingId(finding.id);
    setFindingDraft({
      controlRef: finding.control_ref || "", classification: finding.classification || "OFI", department: finding.department || "",
      title: finding.title || "", evidence: finding.evidence || "", evidenceSource: finding.evidence_source || "",
      impact: finding.impact || "", recommendation: finding.recommendation || "", owner: finding.owner || "", dueDate: finding.due_date || ""
    });
    setNotice("Editing this finding will require confirmation again before it can be used in a document.");
  };

  const updateFindingStatus = async (finding, status) => {
    setError(""); setNotice("");
    try {
      await readResponse(await fetch(`/api/audit/findings/${finding.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
      }));
      await loadWorkspace(projectId);
      setNotice(status === "Confirmed" ? `Finding ${finding.id} confirmed.` : `Finding ${finding.id} updated.`);
    } catch (e) { setError(e.message); }
  };

  const generateDocument = async () => {
    if (!projectId || generating || !aiConsent) return;
    setGenerating(true); setError(""); setNotice("");
    try {
      const data = await readResponse(await fetch(`/api/audit/projects/${encodeURIComponent(projectId)}/documents`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentType, confirmAiProcessing: aiConsent })
      }));
      setWorkspace(current => current ? { ...current, documents: [data.document, ...(current.documents || [])] } : current);
      setAiConsent(false);
      setNotice(`${docLabels[data.document.document_type] || "Document"} draft generated and saved to this project.`);
    } catch (e) { setError(e.message); }
    finally { setGenerating(false); }
  };

  const updateDocumentStatus = async (document, reviewStatus) => {
    setError(""); setNotice("");
    try {
      const data = await readResponse(await fetch(`/api/audit/documents/${document.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviewStatus })
      }));
      setWorkspace(current => current ? { ...current, documents: current.documents.map(row => row.id === document.id ? data.document : row) } : current);
      setNotice(`Document marked ${reviewStatus.toLowerCase()}.`);
    } catch (e) { setError(e.message); }
  };

  const downloadDocument = document => {
    const blob = new Blob([document.content_markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `${document.document_type}-${projectId}-${document.id}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const briefApproved = workspace?.brief?.is_approved === 1;
  const confirmedCount = workspace?.findings?.filter(f => f.status === "Confirmed").length || 0;
  const canReview = ["admin", "manager", "reviewer"].includes(userRole);

  return <section className="module-page audit-workspace">
    <div className="module-heading"><span className="module-icon blue"><ClipboardList size={24}/></span><div><small>SC WORKFLOW / AUDIT REPORT</small><h2>Audit Workspace</h2><p>Confirm project facts and evidence, then generate a reviewable document draft.</p></div></div>
    {error && <div className="auth-error audit-alert"><AlertCircle size={16}/><span>{error}</span></div>}
    {notice && <div className="audit-success"><CheckCircle2 size={16}/><span>{notice}</span></div>}
    {loadingProjects ? <div className="empty-state"><LoaderCircle className="spin" size={22}/><b>Loading accessible projects...</b></div> : projects.length === 0 ? <div className="notice"><ShieldCheck size={18}/><div><b>No accessible projects</b><p>Create a project or ask an administrator to assign you access before using the audit workspace.</p></div></div> : <>
      <div className="audit-project-picker panel"><label htmlFor="audit-project-select">Project</label><select id="audit-project-select" value={projectId} onChange={e => setProjectId(e.target.value)}>{projects.map(p => <option key={p.id} value={p.id}>{p.name} · {p.client} · {p.id}</option>)}</select><button className="secondary-button" onClick={refresh} disabled={loadingWorkspace}><RefreshCw size={14}/> Refresh</button></div>
      {loadingWorkspace ? <div className="empty-state"><LoaderCircle className="spin" size={22}/><b>Loading project audit data...</b></div> : workspace && <>
        <section className="panel audit-panel">
          <div className="panel-heading"><div><h3>Project Brief</h3><p>Brief changes clear its confirmation and require a fresh review.</p></div><span className={`audit-state ${briefApproved ? "confirmed" : "pending"}`}>{briefApproved ? <Check size={13}/> : <AlertCircle size={13}/>} {briefApproved ? "Confirmed" : "Needs confirmation"}</span></div>
          <form className="audit-form" onSubmit={saveBrief}>
            <div className="audit-grid two"><Field label="Standard / criteria" required value={briefDraft.standard} onChange={v=>setBriefDraft({...briefDraft,standard:v})} placeholder="ISO/IEC 27001:2022"/><Field label="Service name" value={briefDraft.serviceName} onChange={v=>setBriefDraft({...briefDraft,serviceName:v})}/></div>
            <Field label="Assessment scope" required multiline value={briefDraft.projectScope} onChange={v=>setBriefDraft({...briefDraft,projectScope:v})} placeholder="Services, departments, systems and exclusions included in this engagement"/>
            <div className="audit-grid three"><Field label="Locations" value={briefDraft.locations} onChange={v=>setBriefDraft({...briefDraft,locations:v})}/><Field label="Audit start" value={briefDraft.auditStart} onChange={v=>setBriefDraft({...briefDraft,auditStart:v})} placeholder="YYYY-MM-DD"/><Field label="Audit end" value={briefDraft.auditEnd} onChange={v=>setBriefDraft({...briefDraft,auditEnd:v})} placeholder="YYYY-MM-DD"/></div>
            <Field label="Source references / notes" required multiline value={briefDraft.sourceReference} onChange={v=>setBriefDraft({...briefDraft,sourceReference:v})} placeholder="Document name, version, page or worksheet used to verify the brief"/>
            <div className="audit-actions"><button className="primary-button action-positive" type="submit" disabled={saving}><Save size={14}/>{saving ? "Saving..." : "Save brief"}</button>{canReview && <button className="secondary-button" type="button" onClick={approveBrief} disabled={saving || !workspace.brief}><CheckCircle2 size={14}/> Confirm brief</button>}</div>
            {!canReview && <small className="audit-review-note">A Reviewer, Manager, or Admin confirms the project brief.</small>}
          </form>
        </section>

        <section className="panel audit-panel">
          <div className="panel-heading"><div><h3>Finding Register</h3><p>{confirmedCount} confirmed · {workspace.findings?.length || 0} total. Only confirmed findings go into AI drafts.</p></div><span className="audit-count">{workspace.findings?.length || 0} findings</span></div>
          <form className="audit-form finding-form" onSubmit={saveFinding}>
            <div className="audit-grid three"><Field label="Control / clause" required value={findingDraft.controlRef} onChange={v=>setFindingDraft({...findingDraft,controlRef:v})} placeholder="e.g. Clause 9.1"/><label className="audit-field">Classification<select required value={findingDraft.classification} onChange={e=>setFindingDraft({...findingDraft,classification:e.target.value})}><option>OFI</option><option>Minor NC</option><option>Major NC</option></select></label><Field label="Department" value={findingDraft.department} onChange={v=>setFindingDraft({...findingDraft,department:v})}/></div>
            <Field label="Finding title" required value={findingDraft.title} onChange={v=>setFindingDraft({...findingDraft,title:v})} placeholder="Short, factual description"/>
            <Field label="Objective evidence" required multiline value={findingDraft.evidence} onChange={v=>setFindingDraft({...findingDraft,evidence:v})} placeholder="What was observed or reviewed? Keep evidence separate from assumptions."/>
            <div className="audit-grid two"><Field label="Evidence source" required value={findingDraft.evidenceSource} onChange={v=>setFindingDraft({...findingDraft,evidenceSource:v})} placeholder="File, page, record ID or interview reference"/><Field label="Impact / risk" value={findingDraft.impact} onChange={v=>setFindingDraft({...findingDraft,impact:v})}/></div>
            <Field label="Recommendation" multiline value={findingDraft.recommendation} onChange={v=>setFindingDraft({...findingDraft,recommendation:v})}/>
            <div className="audit-grid two"><Field label="Action owner" value={findingDraft.owner} onChange={v=>setFindingDraft({...findingDraft,owner:v})}/><Field label="Due date" value={findingDraft.dueDate} onChange={v=>setFindingDraft({...findingDraft,dueDate:v})} placeholder="YYYY-MM-DD"/></div>
            <div className="audit-actions"><button className="primary-button action-positive" type="submit" disabled={saving}><Plus size={14}/>{saving ? "Saving..." : editingId ? "Save finding" : "Add finding"}</button>{editingId && <button className="secondary-button" type="button" onClick={()=>{setEditingId(null);setFindingDraft(emptyFinding);}}>Cancel edit</button>}</div>
          </form>
          <div className="audit-findings-list">{!workspace.findings?.length ? <div className="empty-state"><FileText size={22}/><b>No findings yet</b><span>Add findings with evidence and a source reference.</span></div> : workspace.findings.map(f => <article className="finding-card" key={f.id}>
            <div className="finding-card-top"><div><small>FINDING {String(f.id).padStart(3,"0")} · {f.control_ref}</small><h4>{f.title}</h4></div><span className={`finding-class ${f.classification.toLowerCase().replaceAll(" ","-")}`}>{f.classification}</span></div>
            <p>{f.evidence}</p><div className="finding-meta"><span>Source: {f.evidence_source || "Not set"}</span>{f.department && <span>Department: {f.department}</span>}{f.owner && <span>Owner: {f.owner}</span>}</div>
            <div className="finding-card-footer"><span className={`audit-state ${f.status === "Confirmed" ? "confirmed" : "pending"}`}>{f.status === "Confirmed" ? <Check size={13}/> : <AlertCircle size={13}/>} {f.status}</span><div>{f.status === "Draft" && <button className="text-button" onClick={()=>updateFindingStatus(f,"Confirmed")}>Confirm finding</button>}<button className="text-button" onClick={()=>editFinding(f)}>Edit</button></div></div>
          </article>)}</div>
        </section>

        <section className="panel audit-panel document-panel">
          <div className="panel-heading"><div><h3>Generate Document Draft</h3><p>Uses the confirmed brief and confirmed findings for this project.</p></div><Sparkles size={17}/></div>
          <div className="audit-form">
            <div className="audit-grid two"><label className="audit-field">Document type<select value={documentType} onChange={e=>setDocumentType(e.target.value)}><option value="audit_report">Audit Report</option><option value="close_summary">Closing Meeting Summary</option><option value="car_register">CAR Drafts</option></select></label><div className="audit-readiness"><b>Ready to draft</b><span>{briefApproved ? "Brief confirmed" : "Confirm the brief"} · {confirmedCount} confirmed findings</span></div></div>
            <label className="audit-consent"><input type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/><span>I confirm this project data is approved for processing by the configured AI provider to draft this document.</span></label>
            <div className="audit-actions"><button className="primary-button" type="button" onClick={generateDocument} disabled={generating || !aiConsent || !briefApproved || confirmedCount === 0}><Sparkles size={14}/>{generating ? "Generating..." : `Generate ${docLabels[documentType]}`}</button><small>The AI will receive the approved brief and confirmed findings for the selected project.</small></div>
          </div>
        </section>

        <section className="panel audit-panel">
          <div className="panel-heading"><div><h3>Generated Documents</h3><p>Local draft history and review status for this project.</p></div><span className="audit-count">{workspace.documents?.length || 0} saved</span></div>
          {!workspace.documents?.length ? <div className="empty-state"><FileText size={22}/><b>No generated drafts yet</b><span>Generated documents will be saved here for review.</span></div> : <div className="audit-documents">{workspace.documents.map(d => <article className="generated-document" key={d.id}>
            <div className="generated-document-heading"><div><small>{docLabels[d.document_type] || d.document_type} · {new Date(d.created_at + "Z").toLocaleString()}</small><h4>{d.title}</h4></div><span className={`audit-state ${d.review_status === "Issued" ? "confirmed" : "pending"}`}>{d.review_status}</span></div>
            <pre>{d.content_markdown}</pre>
            <div className="audit-actions"><button className="secondary-button" onClick={()=>downloadDocument(d)}><ArrowDownToLine size={14}/> Download .md</button>{documentExportFormats[d.document_type]&&<a className="secondary-button" href={`/api/audit/documents/${d.id}/export/${documentExportFormats[d.document_type]}`}><ArrowDownToLine size={14}/> Export .{documentExportFormats[d.document_type]}</a>}{canReview && d.review_status === "Draft" && <button className="secondary-button" onClick={()=>updateDocumentStatus(d,"Reviewed")}><CheckCircle2 size={14}/> Mark reviewed</button>}{canReview && d.review_status === "Reviewed" && <button className="primary-button" onClick={()=>updateDocumentStatus(d,"Issued")}><Check size={14}/> Mark issued</button>}</div>
          </article>)}</div>}
        </section>
      </>}
    </>}
  </section>;
}

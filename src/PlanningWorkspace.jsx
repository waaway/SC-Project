import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDownToLine, Check, CheckCircle2, ClipboardList, FileText, LoaderCircle, Plus, RefreshCw, Save, ShieldCheck, Sparkles, Trash2, Users } from "lucide-react";
import { ProjectDocumentSources } from "./ProjectDocumentsWorkspace.jsx";
import "./planning-workflow.css";

const emptyPlan = {
  serviceSummary:"", plannedDurationDays:"", inScopeHeadcount:"", deliveryMode:"Hybrid", communicationsLanguage:"", documentLanguage:"",
  inScopeDepartments:"", primaryStorage:"", thirdParties:"", paymentTerms:"", assumptions:"", sourceReference:"", consultantProfile:"",
  proposalContactName:"", proposalContactRole:"", proposalContactPhone:"", proposalContactEmail:"", deliverables:"", proposalRevision:"1.0", preparedBy:""
};
const emptyPhase = {phaseCode:"",phaseName:"",startDate:"",endDate:"",durationDays:"0",mandays:"0",onsiteDays:"0",offsiteDays:"0",responsibleMembers:""};
const emptyMember = {displayName:"",roleTitle:"",biography:"",education:"",qualifications:"",experience:""};
const documentLabels = {manload:"Manload",proposal:"Technical Proposal",org_chart:"Organization Chart",timeline:"Project Timeline",team_profile:"Team Profile",kickoff:"Kickoff Presentation"};
const documentExportFormats = {manload:"xlsx",proposal:"docx",org_chart:"pptx",timeline:"xlsx",team_profile:"docx",kickoff:"pptx"};
const documentSets = {
  setup:["manload"],
  proposal:["proposal","org_chart","timeline","team_profile"],
  kickoff:["kickoff"]
};

async function readResponse(response) {
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||"The request could not be completed.");
  return data;
}
function InputField({label,value,onChange,type="text",multiline=false,required=false,placeholder="",step}) {
  const Tag=multiline?"textarea":"input";
  return <label className="planning-field">{label}{required&&<span>Required</span>}<Tag type={multiline?undefined:type} step={step} required={required} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;
}

export default function PlanningWorkspace({mode,userRole,userId,allowedPages=[],navigate}) {
  const [projects,setProjects]=useState([]);
  const [projectId,setProjectId]=useState("");
  const [workspace,setWorkspace]=useState(null);
  const [planDraft,setPlanDraft]=useState(emptyPlan);
  const [phaseDraft,setPhaseDraft]=useState(emptyPhase);
  const [memberDraft,setMemberDraft]=useState(emptyMember);
  const [editingPhaseId,setEditingPhaseId]=useState(null);
  const [editingMemberId,setEditingMemberId]=useState(null);
  const [documentType,setDocumentType]=useState(documentSets[mode]?.[0]||"proposal");
  const [aiConsent,setAiConsent]=useState(false);
  const [loadingProjects,setLoadingProjects]=useState(true);
  const [loadingWorkspace,setLoadingWorkspace]=useState(false);
  const [saving,setSaving]=useState(false);
  const [generating,setGenerating]=useState(false);
  const [templateExporting,setTemplateExporting]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const canReview=["admin","manager","reviewer"].includes(userRole);
  const documentTypes=documentSets[mode]||documentSets.proposal;
  const sourceCategory=mode==="setup"?"mainload":mode==="kickoff"?"kickoff":"proposal";
  const title=mode==="setup"?"Mainload & Project Planning":mode==="kickoff"?"Kickoff Presentation":"Proposal Pack";
  const subtitle=mode==="setup"?"Build a source-backed plan, assign the project team and confirm the workload.":mode==="kickoff"?"Draft the kickoff presentation from this project's confirmed plan.":"Generate proposal, organization chart, timeline and team profile drafts from one approved plan.";

  useEffect(()=>{
    let alive=true;
    fetch("/api/planning/projects").then(readResponse).then(data=>{
      if(!alive)return;
      const rows=Array.isArray(data.projects)?data.projects:[];
      setProjects(rows);if(rows.length)setProjectId(rows[0].id);
    }).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoadingProjects(false);});
    return()=>{alive=false;};
  },[]);

  const loadWorkspace=async id=>{
    if(!id){setWorkspace(null);return;}
    setLoadingWorkspace(true);setError("");setNotice("");setAiConsent(false);setEditingPhaseId(null);setEditingMemberId(null);setPhaseDraft(emptyPhase);setMemberDraft(emptyMember);
    try{
      const data=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(id)}`));
      setWorkspace(data);
      const plan=data.plan;
      setPlanDraft(plan?{
        serviceSummary:plan.service_summary||"",plannedDurationDays:plan.planned_duration_days??"",inScopeHeadcount:plan.in_scope_headcount??"",deliveryMode:plan.delivery_mode||"Hybrid",
        communicationsLanguage:plan.communications_language||"",documentLanguage:plan.document_language||"",inScopeDepartments:plan.in_scope_departments||"",primaryStorage:plan.primary_storage||"",
        thirdParties:plan.third_parties||"",paymentTerms:plan.payment_terms||"",assumptions:plan.assumptions||"",sourceReference:plan.source_reference||"",
        consultantProfile:plan.consultant_profile||"",proposalContactName:plan.proposal_contact_name||"",proposalContactRole:plan.proposal_contact_role||"",
        proposalContactPhone:plan.proposal_contact_phone||"",proposalContactEmail:plan.proposal_contact_email||"",deliverables:plan.deliverables||"",
        proposalRevision:plan.proposal_revision||"1.0",preparedBy:plan.prepared_by||""
      }:emptyPlan);
    }catch(e){setError(e.message);setWorkspace(null);}finally{setLoadingWorkspace(false);}
  };
  useEffect(()=>{loadWorkspace(projectId);},[projectId]);
  const refresh=()=>loadWorkspace(projectId);
  const planApproved=workspace?.plan?.is_approved===1;
  const briefApproved=workspace?.brief?.is_approved===1;
  const totalManDays=useMemo(()=>workspace?.phases?.reduce((n,p)=>n+Number(p.mandays||0),0)||0,[workspace?.phases]);
  const totalDuration=useMemo(()=>workspace?.phases?.reduce((n,p)=>n+Number(p.duration_days||0),0)||0,[workspace?.phases]);

  const savePlan=async e=>{
    e.preventDefault();if(saving)return;setSaving(true);setError("");setNotice("");
    try{
      await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/plan`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(planDraft)}));
      await loadWorkspace(projectId);setNotice("Project plan saved. Confirm it again before generating planning documents.");
    }catch(e){setError(e.message);}finally{setSaving(false);}
  };
  const approvePlan=async()=>{
    setSaving(true);setError("");setNotice("");
    try{await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/plan/approve`,{method:"POST"}));await loadWorkspace(projectId);setNotice("Project plan confirmed.");}
    catch(e){setError(e.message);}finally{setSaving(false);}
  };

  const savePhase=async e=>{
    e.preventDefault();if(saving)return;setSaving(true);setError("");setNotice("");
    try{
      const url=editingPhaseId?`/api/planning/phases/${editingPhaseId}`:`/api/planning/projects/${encodeURIComponent(projectId)}/phases`;
      await readResponse(await fetch(url,{method:editingPhaseId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(phaseDraft)}));
      setPhaseDraft(emptyPhase);setEditingPhaseId(null);await loadWorkspace(projectId);setNotice("Phase saved. The plan needs confirmation again.");
    }catch(e){setError(e.message);}finally{setSaving(false);}
  };
  const editPhase=p=>{setEditingPhaseId(p.id);setPhaseDraft({phaseCode:p.phase_code,phaseName:p.phase_name,startDate:p.start_date||"",endDate:p.end_date||"",durationDays:String(p.duration_days||0),mandays:String(p.mandays||0),onsiteDays:String(p.onsite_days||0),offsiteDays:String(p.offsite_days||0),responsibleMembers:p.responsible_members||""});};
  const deletePhase=async p=>{
    if(!window.confirm(`Delete phase ${p.phase_code} — ${p.phase_name}?`))return;
    setError("");setNotice("");try{await readResponse(await fetch(`/api/planning/phases/${p.id}`,{method:"DELETE"}));await loadWorkspace(projectId);setNotice("Phase deleted. The plan needs confirmation again.");}catch(e){setError(e.message);}
  };

  const saveMember=async e=>{
    e.preventDefault();if(saving)return;setSaving(true);setError("");setNotice("");
    try{
      const url=editingMemberId?`/api/planning/team/${editingMemberId}`:`/api/planning/projects/${encodeURIComponent(projectId)}/team`;
      await readResponse(await fetch(url,{method:editingMemberId?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(memberDraft)}));
      setMemberDraft(emptyMember);setEditingMemberId(null);await loadWorkspace(projectId);setNotice("Project team member saved. The plan needs confirmation again.");
    }catch(e){setError(e.message);}finally{setSaving(false);}
  };
  const editMember=m=>{setEditingMemberId(m.id);setMemberDraft({displayName:m.display_name,roleTitle:m.role_title,biography:m.biography||"",education:m.education||"",qualifications:m.qualifications||"",experience:m.experience||""});};
  const deleteMember=async m=>{
    if(!window.confirm(`Remove ${m.display_name} from this project's team?`))return;
    setError("");setNotice("");try{await readResponse(await fetch(`/api/planning/team/${m.id}`,{method:"DELETE"}));await loadWorkspace(projectId);setNotice("Team member removed. The plan needs confirmation again.");}catch(e){setError(e.message);}
  };

  const generateDocument=async()=>{
    if(!aiConsent||generating)return;setGenerating(true);setError("");setNotice("");
    try{
      const data=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/documents`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({documentType,confirmAiProcessing:aiConsent})}));
      setWorkspace(current=>current?{...current,documents:[data.document,...(current.documents||[])]}:current);setAiConsent(false);setNotice(`${documentLabels[data.document.document_type]} draft generated and saved to this project.`);
    }catch(e){setError(e.message);}finally{setGenerating(false);}
  };
  const downloadTemplate=async()=>{
    if(templateExporting||!projectId)return;setTemplateExporting(true);setError("");setNotice("");
    try{
      const response=await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/template-export/${encodeURIComponent(documentType)}`);
      if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"The organization template could not be created.");}
      const blob=await response.blob();const url=URL.createObjectURL(blob);const anchor=window.document.createElement("a");anchor.href=url;anchor.download=`${projectId}-${documentType}-template.${documentExportFormats[documentType]||"docx"}`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      setNotice(`${documentLabels[documentType]} template filled from this project's saved plan and downloaded. No AI was used.`);
    }catch(e){setError(e.message);}finally{setTemplateExporting(false);}
  };
  const updateDocumentStatus=async(doc,reviewStatus)=>{
    setError("");setNotice("");try{
      const data=await readResponse(await fetch(`/api/planning/documents/${doc.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({reviewStatus})}));
      setWorkspace(current=>current?{...current,documents:current.documents.map(d=>d.id===doc.id?data.document:d)}:current);setNotice(`Document marked ${reviewStatus.toLowerCase()}.`);
    }catch(e){setError(e.message);}
  };
  const downloadDocument=doc=>{
    const blob=new Blob([doc.content_markdown],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(blob);const anchor=window.document.createElement("a");
    anchor.href=url;anchor.download=`${doc.document_type}-${projectId}-${doc.id}.md`;anchor.click();URL.revokeObjectURL(url);
  };
  const visibleDocuments=workspace?.documents?.filter(d=>documentTypes.includes(d.document_type))||[];

  return <section className="module-page planning-workspace">
    <div className="module-heading"><span className="module-icon blue">{mode==="setup"?<ClipboardList size={24}/>:mode==="kickoff"?<Users size={24}/>:<FileText size={24}/>}</span><div><small>SC WORKFLOW / {mode.toUpperCase()}</small><h2>{title}</h2><p>{subtitle}</p></div></div>
    {error&&<div className="auth-error planning-alert"><AlertCircle size={16}/><span>{error}</span></div>}
    {notice&&<div className="planning-success"><CheckCircle2 size={16}/><span>{notice}</span></div>}
    {loadingProjects?<div className="empty-state"><LoaderCircle className="spin" size={22}/><b>Loading accessible projects...</b></div>:projects.length===0?<div className="notice"><ShieldCheck size={18}/><div><b>No accessible projects</b><p>Create a project or ask an administrator to assign your project access first.</p></div></div>:<>
      <div className="planning-project-picker panel"><label htmlFor="planning-project">Project</label><select id="planning-project" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.client} · {p.id}</option>)}</select><button className="secondary-button" onClick={refresh} disabled={loadingWorkspace}><RefreshCw size={14}/> Refresh</button></div>
      {loadingWorkspace?<div className="empty-state"><LoaderCircle className="spin" size={22}/><b>Loading project plan...</b></div>:workspace&&<>
        {mode==="setup"&&<>
          <section className="panel planning-panel">
            <div className="panel-heading"><div><h3>Project Plan</h3><p>Enter the planning assumptions and reference sources for this engagement.</p></div><span className={`planning-state ${planApproved?"approved":"pending"}`}>{planApproved?<Check size={13}/>:<AlertCircle size={13}/>} {planApproved?"Confirmed":"Needs confirmation"}</span></div>
            {!briefApproved&&<div className="planning-gate"><AlertCircle size={15}/><div><b>Confirm the Project Brief first</b><p>Planning documents use the approved standard, scope, location and dates from the Audit Report workspace.</p>{allowedPages.includes("Audit Report")&&<button className="text-button" onClick={()=>navigate("Audit Report")}>Open Audit Report brief</button>}</div></div>}
            <form className="planning-form" onSubmit={savePlan}>
              <InputField label="Service summary" required multiline value={planDraft.serviceSummary} onChange={v=>setPlanDraft({...planDraft,serviceSummary:v})} placeholder="Engagement objective, proposed service and main activities"/>
              <div className="planning-grid three"><InputField label="Planned duration (days)" type="number" step="1" value={planDraft.plannedDurationDays} onChange={v=>setPlanDraft({...planDraft,plannedDurationDays:v})}/><InputField label="People in scope" type="number" step="1" value={planDraft.inScopeHeadcount} onChange={v=>setPlanDraft({...planDraft,inScopeHeadcount:v})}/><label className="planning-field">Delivery mode<select value={planDraft.deliveryMode} onChange={e=>setPlanDraft({...planDraft,deliveryMode:e.target.value})}><option>Hybrid</option><option>Onsite</option><option>Offsite</option></select></label></div>
              <div className="planning-grid two"><InputField label="Communication language" value={planDraft.communicationsLanguage} onChange={v=>setPlanDraft({...planDraft,communicationsLanguage:v})}/><InputField label="Document language" value={planDraft.documentLanguage} onChange={v=>setPlanDraft({...planDraft,documentLanguage:v})}/></div>
              <InputField label="In-scope departments" multiline value={planDraft.inScopeDepartments} onChange={v=>setPlanDraft({...planDraft,inScopeDepartments:v})} placeholder="One department per line"/>
              <div className="planning-grid two"><InputField label="Primary storage / environment" value={planDraft.primaryStorage} onChange={v=>setPlanDraft({...planDraft,primaryStorage:v})}/><InputField label="Third parties / providers" multiline value={planDraft.thirdParties} onChange={v=>setPlanDraft({...planDraft,thirdParties:v})}/></div>
              <div className="planning-grid two"><InputField label="Payment terms" multiline value={planDraft.paymentTerms} onChange={v=>setPlanDraft({...planDraft,paymentTerms:v})}/><InputField label="Assumptions / dependencies" multiline value={planDraft.assumptions} onChange={v=>setPlanDraft({...planDraft,assumptions:v})}/></div>
              <details className="planning-template-details"><summary>Proposal template fields <span>Contacts, organization profile, deliverables and document control</span></summary><div className="planning-form planning-template-fields"><InputField label="Consultant organization profile" multiline value={planDraft.consultantProfile} onChange={v=>setPlanDraft({...planDraft,consultantProfile:v})} placeholder="Approved organization background only; do not include unrelated client references"/><div className="planning-grid two"><InputField label="Client key contact" value={planDraft.proposalContactName} onChange={v=>setPlanDraft({...planDraft,proposalContactName:v})}/><InputField label="Contact role / title" value={planDraft.proposalContactRole} onChange={v=>setPlanDraft({...planDraft,proposalContactRole:v})}/></div><div className="planning-grid two"><InputField label="Contact phone" value={planDraft.proposalContactPhone} onChange={v=>setPlanDraft({...planDraft,proposalContactPhone:v})}/><InputField label="Contact email" value={planDraft.proposalContactEmail} onChange={v=>setPlanDraft({...planDraft,proposalContactEmail:v})}/></div><InputField label="Project deliverables" multiline value={planDraft.deliverables} onChange={v=>setPlanDraft({...planDraft,deliverables:v})} placeholder="One deliverable per line"/><div className="planning-grid two"><InputField label="Proposal revision" value={planDraft.proposalRevision} onChange={v=>setPlanDraft({...planDraft,proposalRevision:v})}/><InputField label="Prepared by" value={planDraft.preparedBy} onChange={v=>setPlanDraft({...planDraft,preparedBy:v})}/></div></div></details>
              <InputField label="Source reference" required multiline value={planDraft.sourceReference} onChange={v=>setPlanDraft({...planDraft,sourceReference:v})} placeholder="Source file, version, page/worksheet or approved client instruction"/>
              <div className="planning-actions"><button className="primary-button" type="submit" disabled={saving}><Save size={14}/>{saving?"Saving...":"Save plan"}</button>{canReview&&<button className="secondary-button" type="button" onClick={approvePlan} disabled={saving||!workspace.plan||!briefApproved}><CheckCircle2 size={14}/> Confirm plan</button>}<button className="secondary-button" type="button" onClick={downloadTemplate} disabled={templateExporting||!briefApproved||!planApproved}><ArrowDownToLine size={14}/>{templateExporting?"Creating template...":"Download filled Manload template (.xlsx)"}</button><span>Changing the brief, plan, phases or team clears plan confirmation.</span></div>
            </form>
          </section>

          <section className="panel planning-panel">
            <div className="panel-heading"><div><h3>Phases & Manload</h3><p>Total duration {totalDuration} days · {totalManDays.toFixed(1)} mandays from entered phases.</p></div><span className="planning-count">{workspace.phases?.length||0} phases</span></div>
            <form className="planning-form" onSubmit={savePhase}>
              <div className="planning-grid four"><InputField label="Phase code" required value={phaseDraft.phaseCode} onChange={v=>setPhaseDraft({...phaseDraft,phaseCode:v})} placeholder="A1"/><InputField label="Phase name" required value={phaseDraft.phaseName} onChange={v=>setPhaseDraft({...phaseDraft,phaseName:v})} placeholder="Kickoff meeting"/><InputField label="Start date" type="date" value={phaseDraft.startDate} onChange={v=>setPhaseDraft({...phaseDraft,startDate:v})}/><InputField label="End date" type="date" value={phaseDraft.endDate} onChange={v=>setPhaseDraft({...phaseDraft,endDate:v})}/></div>
              <div className="planning-grid four"><InputField label="Duration (days)" type="number" step="1" value={phaseDraft.durationDays} onChange={v=>setPhaseDraft({...phaseDraft,durationDays:v})}/><InputField label="Mandays" type="number" step="0.25" value={phaseDraft.mandays} onChange={v=>setPhaseDraft({...phaseDraft,mandays:v})}/><InputField label="Onsite days" type="number" step="0.25" value={phaseDraft.onsiteDays} onChange={v=>setPhaseDraft({...phaseDraft,onsiteDays:v})}/><InputField label="Offsite days" type="number" step="0.25" value={phaseDraft.offsiteDays} onChange={v=>setPhaseDraft({...phaseDraft,offsiteDays:v})}/></div>
              <div className="planning-grid two"><InputField label="Responsible project team" value={phaseDraft.responsibleMembers} onChange={v=>setPhaseDraft({...phaseDraft,responsibleMembers:v})} placeholder="Names or project roles"/><div className="planning-actions"><button className="primary-button" type="submit" disabled={saving}><Plus size={14}/>{editingPhaseId?"Save phase":"Add phase"}</button>{editingPhaseId&&<button className="secondary-button" type="button" onClick={()=>{setEditingPhaseId(null);setPhaseDraft(emptyPhase);}}>Cancel</button>}</div></div>
            </form>
            {!workspace.phases?.length?<div className="empty-state planning-empty"><ClipboardList size={22}/><b>No phases yet</b><span>Add phases with durations and mandays for Manload. Add dates before generating Timeline.</span></div>:<div className="planning-table-wrap"><table className="planning-table"><thead><tr><th>CODE / PHASE</th><th>DATES</th><th>DURATION</th><th>MANDAYS</th><th>ON / OFFSITE</th><th>TEAM</th><th/></tr></thead><tbody>{workspace.phases.map(p=><tr key={p.id}><td><b>{p.phase_code}</b><span>{p.phase_name}</span></td><td>{p.start_date||"TBD"} – {p.end_date||"TBD"}</td><td>{p.duration_days} days</td><td>{Number(p.mandays).toFixed(1)}</td><td>{Number(p.onsite_days).toFixed(1)} / {Number(p.offsite_days).toFixed(1)}</td><td>{p.responsible_members||"Unassigned"}</td><td><button className="text-button" onClick={()=>editPhase(p)}>Edit</button><button className="planning-delete" aria-label={`Delete ${p.phase_code}`} onClick={()=>deletePhase(p)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>}
          </section>

          <section className="panel planning-panel">
            <div className="panel-heading"><div><h3>Project Team</h3><p>These team profiles belong to this project only. Add only people selected for this engagement.</p></div><span className="planning-count">{workspace.team?.length||0} members</span></div>
            <form className="planning-form" onSubmit={saveMember}>
              <div className="planning-grid two"><InputField label="Name" required value={memberDraft.displayName} onChange={v=>setMemberDraft({...memberDraft,displayName:v})}/><InputField label="Project role" required value={memberDraft.roleTitle} onChange={v=>setMemberDraft({...memberDraft,roleTitle:v})} placeholder="Lead auditor, project manager"/></div>
              <InputField label="Profile summary" multiline value={memberDraft.biography} onChange={v=>setMemberDraft({...memberDraft,biography:v})} placeholder="Approved short biography for this project"/>
              <div className="planning-grid two"><InputField label="Education" multiline value={memberDraft.education} onChange={v=>setMemberDraft({...memberDraft,education:v})}/><InputField label="Qualifications / certifications" multiline value={memberDraft.qualifications} onChange={v=>setMemberDraft({...memberDraft,qualifications:v})}/></div>
              <InputField label="Relevant experience for this engagement" multiline value={memberDraft.experience} onChange={v=>setMemberDraft({...memberDraft,experience:v})} placeholder="Relevant experience verified for this project only"/>
              <div className="planning-actions"><button className="primary-button" type="submit" disabled={saving}><Plus size={14}/>{editingMemberId?"Save team member":"Add team member"}</button>{editingMemberId&&<button className="secondary-button" type="button" onClick={()=>{setEditingMemberId(null);setMemberDraft(emptyMember);}}>Cancel</button>}<span>Profile text is sent only when you generate a document and confirm AI processing.</span></div>
            </form>
            {!workspace.team?.length?<div className="empty-state planning-empty"><Users size={22}/><b>No project team yet</b><span>Team Profile and Organization Chart drafts need selected project members.</span></div>:<div className="planning-team-list">{workspace.team.map(m=><article className="planning-team-card" key={m.id}><div><small>{m.role_title}</small><h4>{m.display_name}</h4><p>{m.biography||"No profile summary provided."}</p>{(m.education||m.qualifications||m.experience)&&<div className="planning-team-credentials">{m.education&&<span><b>Education</b> {m.education}</span>}{m.qualifications&&<span><b>Qualifications</b> {m.qualifications}</span>}{m.experience&&<span><b>Experience</b> {m.experience}</span>}</div>}</div><div><button className="text-button" onClick={()=>editMember(m)}>Edit</button><button className="planning-delete" aria-label={`Remove ${m.display_name}`} onClick={()=>deleteMember(m)}><Trash2 size={14}/></button></div></article>)}</div>}
          </section>
        </>}

        {mode!=="setup"&&<section className="panel planning-panel planning-generator">
          <div className="panel-heading"><div><h3>{mode==="kickoff"?"Kickoff Presentation":"Proposal Pack Generator"}</h3><p>Generate from the confirmed Project Brief, source-backed plan, schedule and selected project team.</p></div><Sparkles size={17}/></div>
          {(!briefApproved||!planApproved)&&<div className="planning-gate"><AlertCircle size={15}/><div><b>Project Brief and plan confirmation required</b><p>Open Mainload to complete the plan, then have a Reviewer, Manager or Admin confirm it.</p>{allowedPages.includes("Mainload")&&<button className="text-button" onClick={()=>navigate("Mainload")}>Open Mainload</button>}</div></div>}
          <div className="planning-form">
            <div className="planning-grid two"><label className="planning-field">Document type<select value={documentType} onChange={e=>{setDocumentType(e.target.value);setAiConsent(false);}}>{documentTypes.map(t=><option key={t} value={t}>{documentLabels[t]}</option>)}</select></label><div className="planning-readiness"><b>Planning data</b><span>{briefApproved?"Brief confirmed":"Brief needs confirmation"} · {planApproved?"Plan confirmed":"Plan needs confirmation"} · {workspace.team?.length||0} selected team members · {workspace.phases?.length||0} phases</span></div></div>
            <label className="planning-consent"><input type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/><span>I confirm this project's planning data and any team details used for this draft are approved for processing by the configured AI provider.</span></label>
            <div className="planning-actions"><button className="primary-button" type="button" onClick={generateDocument} disabled={generating||!aiConsent||!briefApproved||!planApproved}><Sparkles size={14}/>{generating?"Generating...":`Generate ${documentLabels[documentType]||"document"} with AI`}</button><button className="secondary-button" type="button" onClick={downloadTemplate} disabled={templateExporting||!briefApproved||!planApproved}><ArrowDownToLine size={14}/>{templateExporting?"Creating template...":`Download filled ${documentLabels[documentType]||"document"} template (.${documentExportFormats[documentType]})`}</button><span>The template download fills this project's saved fields without AI. AI generation still needs an active API balance.</span></div>
          </div>
        </section>}

        <section className="panel planning-panel">
          <div className="panel-heading"><div><h3>{mode==="setup"?"Manload Draft History":mode==="kickoff"?"Kickoff Draft History":"Proposal Pack Draft History"}</h3><p>Saved to this project with a review status.</p></div><span className="planning-count">{visibleDocuments.length} drafts</span></div>
          {!visibleDocuments.length?<div className="empty-state planning-empty"><FileText size={22}/><b>No drafts yet</b><span>Approved project inputs will appear in generated planning documents.</span></div>:<div className="planning-doc-list">{visibleDocuments.map(d=><article className="planning-document" key={d.id}>
            <div className="planning-document-heading"><div><small>{documentLabels[d.document_type]} · {d.created_at}</small><h4>{d.title}</h4></div><span className={`planning-state ${d.review_status==="Issued"?"approved":"pending"}`}>{d.review_status}</span></div>
            <pre>{d.content_markdown}</pre>
            <div className="planning-actions"><button className="secondary-button" onClick={()=>downloadDocument(d)}><ArrowDownToLine size={14}/> Download .md</button>{documentExportFormats[d.document_type]&&<a className="secondary-button" href={`/api/planning/documents/${d.id}/export/${documentExportFormats[d.document_type]}`}><ArrowDownToLine size={14}/> Export .{documentExportFormats[d.document_type]}</a>}{canReview&&d.review_status==="Draft"&&<button className="secondary-button" onClick={()=>updateDocumentStatus(d,"Reviewed")}><CheckCircle2 size={14}/> Mark reviewed</button>}{canReview&&d.review_status==="Reviewed"&&<button className="primary-button" onClick={()=>updateDocumentStatus(d,"Issued")}><Check size={14}/> Mark issued</button>}</div>
          </article>)}</div>}
        </section>
        <ProjectDocumentSources category={sourceCategory} project={workspace.project} userRole={userRole} userId={userId}/>
      </>}
    </>}
  </section>;
}

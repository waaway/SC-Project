import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowDownToLine, Check, CheckCircle2, ClipboardList, Eraser, FileText, LoaderCircle, LockKeyhole, Pencil, RefreshCw, Save, ShieldCheck, Sparkles, Upload, Users, X } from "lucide-react";
import { ProjectDocumentSources } from "./ProjectDocumentsWorkspace.jsx";
import { manloadRoleSlots, orderManloadTeam } from "../shared/manload.js";
import "./planning-workflow.css";

const emptyPlan = {
  serviceSummary:"", plannedDurationDays:"", inScopeHeadcount:"", deliveryMode:"Hybrid", communicationsLanguage:"", documentLanguage:"",
  inScopeDepartments:"", primaryStorage:"", thirdParties:"", paymentTerms:"", assumptions:"", sourceReference:"", consultantProfile:"",
  proposalContactName:"", proposalContactRole:"", proposalContactPhone:"", proposalContactEmail:"", deliverables:"", proposalRevision:"", preparedBy:"",
  manloadDate:"",manloadCustomerName:"",manloadProjectCode:"",manloadProjectName:"",manloadServiceName:"",onsiteManloadDate:"",offsiteManloadDate:"",onsiteScope:"",offsiteScope:"",securityConsultant:"",teamGroupLabel:"Quality and Other Standard Planned MD"
};
const emptyPhase = () => ({phaseCode:"",phaseName:"",paymentTerms:"",startDate:"",endDate:"",durationDays:"0",mandays:"0",onsiteDays:"0",offsiteDays:"0",memberAllocations:{},responsibleMembers:"",id:null,clientKey:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,dirty:true});
const documentLabels = {manload:"Manload",proposal:"Technical Proposal",org_chart:"Organization Chart",timeline:"Project Timeline",team_profile:"Team Profile",kickoff:"Kickoff Presentation"};
const documentExportFormats = {manload:"xlsx",proposal:"docx",org_chart:"pptx",timeline:"xlsx",team_profile:"docx",kickoff:"pptx"};
const documentSets = {
  setup:["manload"],
  proposal:["proposal","org_chart","timeline","team_profile"],
  kickoff:["kickoff"]
};

async function readResponse(response) {
  const data=await response.json().catch(()=>({}));
  if(!response.ok) throw new Error(data.error||`The request could not be completed (HTTP ${response.status}).`);
  return data;
}
function readAllocations(value) { try { const parsed=typeof value==="string"?JSON.parse(value||"{}"):value;return parsed&&typeof parsed==="object"&&!Array.isArray(parsed)?parsed:{}; } catch { return {}; } }
function allocationTotals(row,sheetKey="onsiteSheet") {
  const allocations=readAllocations(row.memberAllocations);
  const sheet=allocations[sheetKey]||{};
  return Object.values(sheet).reduce((total,item)=>({mandays:total.mandays+Number(item.offsiteDays||0)+Number(item.onsiteDays||0),offsiteDays:total.offsiteDays+Number(item.offsiteDays||0),onsiteDays:total.onsiteDays+Number(item.onsiteDays||0)}),{mandays:0,offsiteDays:0,onsiteDays:0});
}
function phaseColumnValue(row,column,sheetKey) {
  if(column.allocationMemberId)return String(readAllocations(row.memberAllocations)[sheetKey]?.[column.allocationMemberId]?.[column.allocationMode]??"");
  if(column.key==="mandays"||column.key==="offsiteDays"||column.key==="onsiteDays")return String(allocationTotals(row,sheetKey)[column.key]);
  return row[column.key]??"";
}
function formatManloadDay(value) { return value===""||value==null?"":Number.isFinite(Number(value))?Number(value).toFixed(1):value; }
function InputField({label,value,onChange,type="text",multiline=false,required=false,placeholder="",step,className=""}) {
  const Tag=multiline?"textarea":"input";
  return <label className={`planning-field ${className}`.trim()}>{label}{required&&<span>Required</span>}<Tag type={multiline?undefined:type} step={step} required={required} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/></label>;
}

export default function PlanningWorkspace({mode,userRole,userId,allowedPages=[],navigate}) {
  const [projects,setProjects]=useState([]);
  const [projectId,setProjectId]=useState("");
  const [workspace,setWorkspace]=useState(null);
  const [planDraft,setPlanDraft]=useState(emptyPlan);
  const [phaseRows,setPhaseRows]=useState([]);
  const [sections,setSections]=useState([]);
  const [sheetMode,setSheetMode]=useState("onsiteSheet");
  const [documentType,setDocumentType]=useState(documentSets[mode]?.[0]||"proposal");
  const [aiConsent,setAiConsent]=useState(false);
  const [loadingProjects,setLoadingProjects]=useState(true);
  const [loadingWorkspace,setLoadingWorkspace]=useState(false);
  const [saving,setSaving]=useState(false);
  const [reopeningManload,setReopeningManload]=useState(false);
  const [generating,setGenerating]=useState(false);
  const [templateExporting,setTemplateExporting]=useState(false);
  const [manloadDownloadConfirmOpen,setManloadDownloadConfirmOpen]=useState(false);
  const [manloadImportFile,setManloadImportFile]=useState(null);
  const [manloadImportPreview,setManloadImportPreview]=useState(null);
  const [manloadImporting,setManloadImporting]=useState(false);
  const [clearDaysScope,setClearDaysScope]=useState(null);
  const [clearingDays,setClearingDays]=useState(false);
  const [clearDaysError,setClearDaysError]=useState("");
  const [clearHeaderOpen,setClearHeaderOpen]=useState(false);
  const [clearingHeader,setClearingHeader]=useState(false);
  const [clearHeaderError,setClearHeaderError]=useState("");
  const [manloadTeamDrafts,setManloadTeamDrafts]=useState(manloadRoleSlots.map(roleTitle=>({memberId:null,displayName:"",roleTitle})));
  const [activeAllocationCell,setActiveAllocationCell]=useState(null);
  const [activePhaseDurationId,setActivePhaseDurationId]=useState(null);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const canReview=["admin","manager","reviewer"].includes(userRole);
  const manloadTeam=useMemo(()=>orderManloadTeam(workspace?.team||[]),[workspace?.team]);
  const selectedTeamProfiles=(workspace?.team||[]).filter(member=>String(member.display_name||"").trim());
  const manloadTeamDirty=manloadTeamDrafts.some((draft,slot)=>draft.memberId!==(manloadTeam[slot]?.id||null)||draft.displayName!==String(manloadTeam[slot]?.display_name||"")||draft.roleTitle!==String(manloadTeam[slot]?.role_title||manloadRoleSlots[slot]));
  const phaseColumns=useMemo(()=>[
    {key:"phaseCode",label:"Code",type:"text"},{key:"phaseName",label:"Description",type:"text"},{key:"paymentTerms",label:"Payment terms",type:"text"},
    {key:"durationDays",label:"Duration (day)",type:"number",step:1,summary:true,readOnly:true},{key:"mandays",label:"Manday",type:"number",readOnly:true,summary:true},
    ...Array.from({length:4},(_,slot)=>{
      const member=manloadTeam[slot];
      return [
        {key:`allocation-${member?.id||`empty-${slot}`}-offsite`,label:["OFFSITE","OFFSITE1","OFFSITE3","OFFSITE5"][slot],title:member?.display_name?`${member.display_name} · ${member.role_title}`:"Unassigned team slot",type:"number",step:0.5,allocationMemberId:member?.id||null,allocationMode:"offsiteDays",summary:true,slot},
        {key:`allocation-${member?.id||`empty-${slot}`}-onsite`,label:["ONSITE","ONSITE2","ONSITE4","ONSITE6"][slot],title:member?.display_name?`${member.display_name} · ${member.role_title}`:"Unassigned team slot",type:"number",step:0.5,allocationMemberId:member?.id||null,allocationMode:"onsiteDays",summary:true,slot}
      ];
    }).flat()
  ],[manloadTeam]);
  useEffect(()=>{setManloadTeamDrafts(Array.from({length:4},(_,slot)=>({memberId:manloadTeam[slot]?.id||null,displayName:manloadTeam[slot]?.display_name||"",roleTitle:manloadTeam[slot]?.role_title||manloadRoleSlots[slot]})));},[manloadTeam]);
  const documentTypes=documentSets[mode]||documentSets.proposal;
  const sourceCategory=mode==="setup"?"manload":mode==="kickoff"?"kickoff":"proposal";
  const title=mode==="setup"?"Manloading Plan and Tracking":mode==="kickoff"?"Kickoff Presentation":"Proposal Pack";

  useEffect(()=>{
    let alive=true;
    fetch("/api/planning/projects").then(readResponse).then(data=>{
      if(!alive)return;
      const rows=Array.isArray(data.projects)?data.projects:[];
      setProjects(rows);if(rows.length){const initial=mode==="setup"?rows.find(project=>Number(project.manload_locked)!==1)||rows[0]:rows[0];setProjectId(initial.id);}
    }).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoadingProjects(false);});
    return()=>{alive=false;};
  },[]);

  const loadWorkspace=async id=>{
    if(!id){setWorkspace(null);return;}
    setManloadImportFile(null);setManloadImportPreview(null);
    setLoadingWorkspace(true);setError("");setNotice("");setAiConsent(false);
    try{
      const data=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(id)}`));
      setWorkspace(data);
      setSections((data.sections||[]).map(section=>({...section,clientKey:`section-${section.id}`,dirty:false})));
      setPhaseRows((data.phases||[]).map(p=>({id:p.id,sectionId:p.section_id,clientKey:`phase-${p.id}`,phaseCode:p.phase_code,phaseName:p.phase_name,paymentTerms:p.payment_terms||"",startDate:p.start_date||"",endDate:p.end_date||"",durationDays:String(p.duration_days??0),mandays:String(p.mandays??0),onsiteDays:String(p.onsite_days??0),offsiteDays:String(p.offsite_days??0),memberAllocations:readAllocations(p.member_allocations),responsibleMembers:p.responsible_members||"",dirty:false})));
      const plan=data.plan;
      setPlanDraft(plan?{
        serviceSummary:plan.service_summary||"",plannedDurationDays:plan.planned_duration_days??"",inScopeHeadcount:plan.in_scope_headcount??"",deliveryMode:plan.delivery_mode||"Hybrid",
        communicationsLanguage:plan.communications_language||"",documentLanguage:plan.document_language||"",inScopeDepartments:plan.in_scope_departments||"",primaryStorage:plan.primary_storage||"",
        thirdParties:plan.third_parties||"",paymentTerms:plan.payment_terms||"",assumptions:plan.assumptions||"",sourceReference:plan.source_reference||"",
        consultantProfile:plan.consultant_profile||"",proposalContactName:plan.proposal_contact_name||"",proposalContactRole:plan.proposal_contact_role||"",
        proposalContactPhone:plan.proposal_contact_phone||"",proposalContactEmail:plan.proposal_contact_email||"",deliverables:plan.deliverables||"",
        proposalRevision:plan.proposal_revision??"",preparedBy:plan.prepared_by||"",manloadDate:plan.manload_date||"",manloadCustomerName:plan.manload_customer_name||"",manloadProjectCode:plan.manload_project_code||"",manloadProjectName:plan.manload_project_name||"",manloadServiceName:plan.manload_service_name||"",onsiteManloadDate:plan.onsite_manload_date||"",offsiteManloadDate:plan.offsite_manload_date||"",onsiteScope:plan.onsite_scope||"",offsiteScope:plan.offsite_scope||"",securityConsultant:plan.security_consultant||"",teamGroupLabel:plan.team_group_label||"Quality and Other Standard Planned MD"
      }:{...emptyPlan});
    }catch(e){setError(e.message);setWorkspace(null);}finally{setLoadingWorkspace(false);}
  };
  useEffect(()=>{loadWorkspace(projectId);},[projectId]);
  const refresh=()=>loadWorkspace(projectId);
  const briefApproved=workspace?.brief?.is_approved===1;
  const manloadReadOnly=mode==="setup"&&Number(workspace?.project?.manload_locked)===1;
  const totalManDays=useMemo(()=>phaseRows.reduce((n,p)=>n+allocationTotals(p,sheetMode).mandays,0),[phaseRows,sheetMode]);
  const totalDuration=useMemo(()=>sections.reduce((n,s)=>n+Number(s.duration_days||0),0),[sections]);

  const previewManloadImport=async()=>{
    if(!manloadImportFile||manloadImporting)return;
    setManloadImporting(true);setError("");setNotice("");setManloadImportPreview(null);
    try{
      const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||"").split(",")[1]||"");reader.onerror=()=>reject(new Error("Could not read the selected workbook."));reader.readAsDataURL(manloadImportFile);});
      const preview=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/manload/import-preview`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({base64})}));
      setManloadImportPreview(preview);
    }catch(e){setError(e.message);}finally{setManloadImporting(false);}
  };
  const applyManloadImport=async()=>{
    if(!manloadImportPreview?.canImport||manloadImporting)return;
    setManloadImporting(true);setError("");setNotice("");
    try{
      await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/manload/import-apply`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:manloadImportPreview.token})}));
      setManloadImportPreview(null);setManloadImportFile(null);const picker=window.document.getElementById("manload-workbook-file");if(picker)picker.value="";
      await loadWorkspace(projectId);setNotice("Manload data imported from the workbook. Review it and save any further edits before downloading.");
    }catch(e){setError(e.message);}finally{setManloadImporting(false);}
  };
  const requestClearDays=scope=>{setClearDaysError("");setClearDaysScope(scope);};
  const confirmClearDays=async()=>{
    if(saving||clearingDays||!clearDaysScope)return;
    const sheetName=clearDaysScope==="onsiteSheet"?"(First Cert) M-Onsite":"(First Cert) M-Offsite";
    const pendingHeader=planDraft,pendingSections=sections.filter(section=>section.dirty);
    setClearingDays(true);setError("");setNotice("");setClearDaysError("");
    try{
      await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/manload/clear-days`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sheetKey:clearDaysScope})}));
      setClearDaysScope(null);await loadWorkspace(projectId);setPlanDraft(pendingHeader);if(pendingSections.length)setSections(current=>current.map(section=>{const pending=pendingSections.find(item=>item.id===section.id);return pending?{...section,section_name:pending.section_name,duration_days:pending.duration_days,dirty:true}:section;}));setNotice(`${sheetName} day allocations and Manload team names cleared.`);
    }catch(e){setClearDaysError(e.message);}finally{setClearingDays(false);}
  };
  const confirmClearHeader=async()=>{
    if(saving||clearingHeader)return;
    const clearedDraft={...planDraft,manloadDate:"",manloadCustomerName:"",manloadProjectCode:"",manloadProjectName:"",manloadServiceName:"",onsiteManloadDate:"",offsiteManloadDate:"",onsiteScope:"",offsiteScope:"",securityConsultant:"",proposalRevision:"",preparedBy:""};
    setClearingHeader(true);setError("");setNotice("");setClearHeaderError("");
    try{
      await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/plan`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(clearedDraft)}));
      setClearHeaderOpen(false);setPlanDraft(clearedDraft);await loadWorkspace(projectId);setNotice("Manload header fields cleared.");
    }catch(e){setClearHeaderError(e.message);}finally{setClearingHeader(false);}
  };

  const updatePhaseCell=(rowIndex,column,value)=>setPhaseRows(rows=>rows.map((row,index)=>{
    if(index!==rowIndex)return row;
    if(column.allocationMemberId){
      const memberId=String(column.allocationMemberId),current=readAllocations(row.memberAllocations),sheet={...(current[sheetMode]||{})};
      const nextAllocations={...current,[sheetMode]:{...sheet,[memberId]:{onsiteDays:sheet[memberId]?.onsiteDays??"",offsiteDays:sheet[memberId]?.offsiteDays??"",[column.allocationMode]:value}}};
      const next={...row,memberAllocations:nextAllocations,dirty:true};return {...next,...allocationTotals(next,sheetMode)};
    }
    return {...row,[column.key]:value,dirty:true};
  }));
  const pastePhaseCells=(event,rowIndex,key)=>{
    const text=event.clipboardData?.getData("text/plain")||"";
    if(!/[\t\r\n]/.test(text))return;
    event.preventDefault();
    const startColumn=Math.max(0,phaseColumns.findIndex(column=>column.key===key));
    const matrix=text.replace(/\r/g,"").trimEnd().split("\n").map(line=>line.split("\t"));
    if(matrix.length&&/^(code|phase code)$/i.test(matrix[0][0]?.trim()||""))matrix.shift();
    setPhaseRows(rows=>{
      const next=rows.map(row=>({...row}));
      matrix.forEach((cells,r)=>cells.forEach((value,c)=>{
        const targetColumn=phaseColumns[startColumn+c];if(!targetColumn||targetColumn.readOnly)return;
        const targetIndex=rowIndex+r;
        while(next.length<=targetIndex)next.push(emptyPhase());
        const targetRow=next[targetIndex];
        if(targetColumn.allocationMemberId){
          const memberId=String(targetColumn.allocationMemberId),current=readAllocations(targetRow.memberAllocations),sheet={...(current[sheetMode]||{})};
          const updated={...targetRow,memberAllocations:{...current,[sheetMode]:{...sheet,[memberId]:{onsiteDays:sheet[memberId]?.onsiteDays??"",offsiteDays:sheet[memberId]?.offsiteDays??"",[targetColumn.allocationMode]:value.trim()}}},dirty:true};
          next[targetIndex]={...updated,...allocationTotals(updated,sheetMode)};
        }else next[targetIndex]={...targetRow,[targetColumn.key]:value.trim(),dirty:true};
      }));
      return next;
    });
  };
  const saveManloadHeader=async()=>{
    if(saving)return;
    setSaving(true);setError("");setNotice("");
    try{
      const data=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/plan`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(planDraft)}));
      if(data.planning?.plan)setWorkspace(current=>current?{...current,plan:data.planning.plan}:current);
      setNotice("Manload header fields saved.");
    }catch(e){setError(e.message);}finally{setSaving(false);}
  };
  const saveManloadWorksheet=async({includeHeader=false,continueToProposal=false}={})=>{
    if(saving)return;
    const changedSections=sections.filter(section=>section.dirty),changedRows=phaseRows.filter(row=>row.dirty);
    if(changedRows.some(row=>!row.phaseCode.trim()||!row.phaseName.trim())){setError("Every task row needs both a code and description.");return;}
    const slots=manloadTeamDrafts.map(slot=>({memberId:slot.memberId,displayName:slot.displayName.trim(),roleTitle:slot.roleTitle.trim()}));
    if(manloadTeamDirty&&slots.some(slot=>!slot.roleTitle)){setError("Enter a role for each Manload team slot.");return;}
    const names=slots.map(slot=>slot.displayName.toLocaleLowerCase()).filter(Boolean);
    if(manloadTeamDirty&&new Set(names).size!==names.length){setError("Each Manload team member must have a unique name.");return;}
    setSaving(true);setError("");setNotice("");
    try{
      if(includeHeader)await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/plan`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(planDraft)}));
      let teamForSaving=workspace?.team||[];
      if(manloadTeamDirty){
        const response=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/manload/team-slots`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({slots})}));
        teamForSaving=orderManloadTeam(response.planning?.team||teamForSaving);
      }
      for(const section of changedSections)await readResponse(await fetch(`/api/planning/sections/${section.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({sectionName:section.section_name,durationDays:section.duration_days})}));
      for(const row of changedRows){
        const memberAllocations=readAllocations(row.memberAllocations),sheetAllocations=memberAllocations[sheetMode]||{};
        const hasWorksheetAllocations=Object.keys(memberAllocations.onsiteSheet||{}).length>0||Object.keys(memberAllocations.offsiteSheet||{}).length>0;
        const assignedMembers=teamForSaving.filter(member=>{const allocation=sheetAllocations[String(member.id)];return Number(allocation?.offsiteDays||0)>0||Number(allocation?.onsiteDays||0)>0;}).map(member=>member.display_name).filter(Boolean);
        const hasAllocationEntries=Object.keys(memberAllocations).length>0;
        const allSheetTotals=["onsiteSheet","offsiteSheet"].reduce((total,key)=>{const value=allocationTotals(row,key);return {onsiteDays:total.onsiteDays+value.onsiteDays,offsiteDays:total.offsiteDays+value.offsiteDays,mandays:total.mandays+value.mandays};},{onsiteDays:0,offsiteDays:0,mandays:0});
        const payload={sectionId:row.sectionId,phaseCode:row.phaseCode,phaseName:row.phaseName,paymentTerms:row.paymentTerms,memberAllocations,startDate:row.startDate,endDate:row.endDate,durationDays:row.durationDays,mandays:hasWorksheetAllocations?allSheetTotals.mandays:Number(row.mandays||0),onsiteDays:hasWorksheetAllocations?allSheetTotals.onsiteDays:row.onsiteDays,offsiteDays:hasWorksheetAllocations?allSheetTotals.offsiteDays:row.offsiteDays,responsibleMembers:assignedMembers.join(", ")||(hasAllocationEntries?"":row.responsibleMembers)};
        const url=row.id?`/api/planning/phases/${row.id}`:`/api/planning/projects/${encodeURIComponent(projectId)}/phases`;
        await readResponse(await fetch(url,{method:row.id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}));
      }
      const pendingHeader=planDraft;
      if(continueToProposal){
        const next=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/manload/complete`,{method:"POST"}));
        if(next.project)setProjects(current=>current.map(project=>project.id===next.project.id?{...project,...next.project}:project));
      }
      await loadWorkspace(projectId);
      if(!includeHeader)setPlanDraft(pendingHeader);
      if(continueToProposal)navigate("Proposal");
      else setNotice("Manload worksheet saved.");
    }catch(e){setError(e.message);}finally{setSaving(false);}
  };
  const reopenManload=async()=>{
    if(reopeningManload)return;
    setReopeningManload(true);setError("");setNotice("");
    try{
      const data=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/manload/reopen`,{method:"POST"}));
      if(data.project)setProjects(current=>current.map(project=>project.id===data.project.id?{...project,...data.project}:project));
      await loadWorkspace(projectId);
      setNotice("Manload is editable again. Save and continue to Proposal when your changes are ready.");
    }catch(e){setError(e.message);}finally{setReopeningManload(false);}
  };
  const deletePhase=async p=>{
    const row=phaseRows.find(item=>item.clientKey===p.clientKey);
    if(!row?.id){setPhaseRows(rows=>rows.filter(item=>item.clientKey!==p.clientKey));return;}
    if(!window.confirm(`Delete phase ${p.phaseCode} — ${p.phaseName}?`))return;
    setError("");setNotice("");try{await readResponse(await fetch(`/api/planning/phases/${row.id}`,{method:"DELETE"}));await loadWorkspace(projectId);setNotice("Phase deleted.");}catch(e){setError(e.message);}
  };
  const addSection=async()=>{
    const sectionName=`Phase ${sections.length+1}`;
    setSaving(true);setError("");setNotice("");
    try{await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/sections`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sectionName,durationDays:0})}));await loadWorkspace(projectId);setNotice("Phase group added.");}
    catch(e){setError(e.message);}finally{setSaving(false);}
  };
  const updateSection=(id,key,value)=>setSections(items=>items.map(item=>item.id===id?{...item,[key]:value,dirty:true}:item));
  const deleteSection=async section=>{
    if(phaseRows.some(row=>row.sectionId===section.id)){setError("Move or delete the tasks in this group before deleting it.");return;}
    try{await readResponse(await fetch(`/api/planning/sections/${section.id}`,{method:"DELETE"}));await loadWorkspace(projectId);setNotice("Phase group deleted.");}catch(e){setError(e.message);}
  };
  const addTask=section=>setPhaseRows(rows=>[...rows, {...emptyPhase(),sectionId:section.id}]);

  const generateDocument=async()=>{
    if(!aiConsent||generating)return;setGenerating(true);setError("");setNotice("");
    try{
      const data=await readResponse(await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/documents`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({documentType,confirmAiProcessing:aiConsent})}));
      setWorkspace(current=>current?{...current,documents:[data.document,...(current.documents||[])]}:current);setAiConsent(false);setNotice(`${documentLabels[data.document.document_type]} draft generated and saved to this project.`);
    }catch(e){setError(e.message);}finally{setGenerating(false);}
  };
  const downloadTemplate=async()=>{
    if(templateExporting||!projectId)return;
    // Reserve a tab during the user click. Safari may block a download started
    // from a synthetic anchor after the fetch promise has already resolved.
    const downloadTab=window.open("about:blank","_blank");
    setTemplateExporting(true);setError("");setNotice("");
    try{
      const response=await fetch(`/api/planning/projects/${encodeURIComponent(projectId)}/template-export/${encodeURIComponent(documentType)}`);
      if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"The organization template could not be created.");}
      const blob=await response.blob();const url=URL.createObjectURL(blob);
      if(downloadTab)downloadTab.location.href=url;
      else{const anchor=window.document.createElement("a");anchor.href=url;anchor.download=`${projectId}-${documentType}-template.${documentExportFormats[documentType]||"docx"}`;anchor.click();}
      setTimeout(()=>URL.revokeObjectURL(url),60000);
      setNotice(`${documentLabels[documentType]} template filled from this project's saved plan and downloaded. No AI was used.`);
    }catch(e){downloadTab?.close();setError(e.message);}finally{setTemplateExporting(false);}
  };
  const confirmManloadDownload=()=>{
    setManloadDownloadConfirmOpen(false);
    downloadTemplate();
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
    <div className="module-heading"><span className="module-icon blue">{mode==="setup"?<ClipboardList size={24}/>:mode==="kickoff"?<Users size={24}/>:<FileText size={24}/>}</span><div><small>SC WORKFLOW / {mode.toUpperCase()}</small><h2>{title}</h2></div></div>
    {error&&<div className="auth-error planning-alert"><AlertCircle size={16}/><span>{error}</span></div>}
    {notice&&<div className="planning-success"><CheckCircle2 size={16}/><span>{notice}</span></div>}
    {loadingProjects?<div className="empty-state"><LoaderCircle className="spin" size={22}/><b>Loading accessible projects...</b></div>:projects.length===0?<div className="notice"><ShieldCheck size={18}/><div><b>No accessible projects</b><p>Create a project or ask an administrator to assign your project access first.</p></div></div>:<>
      <div className="planning-project-picker panel"><label htmlFor="planning-project">Project</label><select id="planning-project" value={projectId} onChange={e=>setProjectId(e.target.value)}>{projects.map(p=><option key={p.id} value={p.id}>{p.name} · {p.client} · {p.id} · {p.stage} · {Number(p.manload_locked)===1?"Manload saved":"Manload editable"}</option>)}</select><button className="secondary-button" onClick={refresh} disabled={loadingWorkspace}><RefreshCw size={14}/> Refresh</button></div>
      {loadingWorkspace?<div className="empty-state"><LoaderCircle className="spin" size={22}/><b>Loading project plan...</b></div>:workspace&&<>
        {mode==="setup"&&<>
          <section className={`manload-mode-banner ${manloadReadOnly?"is-readonly":"is-editing"}`} role="status" aria-live="polite">
            <span className="manload-mode-icon">{manloadReadOnly?<LockKeyhole size={19}/>:<Pencil size={19}/>}</span>
            <div className="manload-mode-copy"><strong>{manloadReadOnly?"Manload is read-only":"Manload editing is enabled"}</strong></div>
            {manloadReadOnly&&<button className="secondary-button manload-edit-button" type="button" onClick={reopenManload} disabled={reopeningManload}><Pencil size={15}/>{reopeningManload?"Enabling edit...":"Edit Manload"}</button>}
          </section>
          <fieldset className="manload-editable-fields" disabled={manloadReadOnly}>
          <section className="panel planning-panel">
            <div className="panel-heading"><div><h3>Import / replace Manload XLSX</h3></div><Upload size={17}/></div>
            <div className="planning-form">
              <div className="manload-import-picker"><input id="manload-workbook-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={event=>{setManloadImportFile(event.target.files?.[0]||null);setManloadImportPreview(null);setError("");}}/><button className="secondary-button" type="button" onClick={previewManloadImport} disabled={!manloadImportFile||manloadImporting}><Upload size={14}/>{manloadImporting?"Reading workbook...":"Read and preview"}</button></div>
              {manloadImportPreview&&<div className="manload-import-preview">
                <div className="manload-import-summary"><b>{manloadImportFile?.name||"Manload workbook"}</b><span>Customer: {manloadImportPreview.parsed.projectIdentity.customer||"—"}</span><span>Project code: {manloadImportPreview.parsed.projectIdentity.projectCode||"—"}</span><span>Project: {manloadImportPreview.parsed.projectIdentity.projectName||"—"}</span><span>Team: {manloadImportPreview.parsed.team.map(member=>`${member.name} (${member.role})`).join(", ")||"None"}</span><span>Service Name: {manloadImportPreview.parsed.header.serviceName||"—"}</span><span>Security Consultant: {manloadImportPreview.parsed.header.securityConsultant||"—"}</span><span>Revision: {manloadImportPreview.parsed.header.revision||"—"}</span><span>Prepared by: {manloadImportPreview.parsed.header.preparedBy||"—"}</span></div>
                <div className="manload-import-sheets">{Object.entries(manloadImportPreview.parsed.sheets).map(([key,sheet])=><article key={key}><h4>{key==="onsite"?"(First Cert) M-Onsite":"(First Cert) M-Offsite"}</h4><p>Date: {sheet.date||"—"} · Scope: {sheet.scope||"—"}</p>{sheet.sections.map(section=><div className="manload-import-section" key={section.name}><b>{section.name} · {section.durationDays} days</b><ul>{section.tasks.map(task=><li key={task.code}><span>{task.code} · {task.description}</span><small>{task.paymentTerms?`Payment terms: ${task.paymentTerms} · `:""}Manday: {Object.values(task.allocations).reduce((sum,value)=>sum+Number(value.offsiteDays||0)+Number(value.onsiteDays||0),0)} · {Object.entries(task.allocations).map(([name,value])=>`${name}: ${value.offsiteDays===""?"blank":value.offsiteDays} offsite / ${value.onsiteDays===""?"blank":value.onsiteDays} onsite`).join("; ")||"No team days"}</small></li>)}</ul></div>)}</article>)}</div>
                {(manloadImportPreview.existingCounts.hasPlan||manloadImportPreview.existingCounts.sections||manloadImportPreview.existingCounts.phases||manloadImportPreview.existingCounts.team)&&<div className="planning-gate"><AlertCircle size={15}/><div><b>This import replaces existing Manload data</b></div></div>}
                <div className="planning-actions"><button className="primary-button" type="button" onClick={applyManloadImport} disabled={!manloadImportPreview.canImport||manloadImporting}><Upload size={14}/>{manloadImporting?"Importing...":(manloadImportPreview.existingCounts.hasPlan||manloadImportPreview.existingCounts.sections||manloadImportPreview.existingCounts.phases||manloadImportPreview.existingCounts.team)?"Replace Manload data from workbook":"Import workbook into Manload"}</button><button className="secondary-button" type="button" onClick={()=>{setManloadImportPreview(null);setManloadImportFile(null);const picker=window.document.getElementById("manload-workbook-file");if(picker)picker.value="";}}>Cancel</button></div>
              </div>}
            </div>
          </section>
          <section className="panel planning-panel">
              <div className="panel-heading"><div><h3>Manloading Plan</h3></div></div>
            {workspace.plan?.manload_date&&!planDraft.onsiteManloadDate&&!planDraft.offsiteManloadDate&&<div className="planning-gate"><AlertCircle size={15}/><div><b>An older shared Manload date is saved</b></div></div>}
            <form className="planning-form" onSubmit={event=>{event.preventDefault();saveManloadHeader();}}>
              <div className="planning-grid three"><InputField label="Customer Name" value={planDraft.manloadCustomerName} onChange={v=>setPlanDraft({...planDraft,manloadCustomerName:v})}/><InputField label="Project code" value={planDraft.manloadProjectCode} onChange={v=>setPlanDraft({...planDraft,manloadProjectCode:v})}/><InputField label="Project Name" value={planDraft.manloadProjectName} onChange={v=>setPlanDraft({...planDraft,manloadProjectName:v})}/></div>
              <InputField label="Service Name" value={planDraft.manloadServiceName} onChange={v=>setPlanDraft({...planDraft,manloadServiceName:v})}/>
              <div className="planning-grid two"><InputField label="Onsite worksheet · Date" type="date" value={planDraft.onsiteManloadDate} onChange={v=>setPlanDraft({...planDraft,onsiteManloadDate:v})}/><InputField label="Offsite worksheet · Date" type="date" value={planDraft.offsiteManloadDate} onChange={v=>setPlanDraft({...planDraft,offsiteManloadDate:v})}/></div>
              <div className="planning-grid two"><InputField className="manload-scope-field" label="Onsite worksheet · Scope of work" multiline value={planDraft.onsiteScope} onChange={v=>setPlanDraft({...planDraft,onsiteScope:v})}/><InputField className="manload-scope-field" label="Offsite worksheet · Scope of work" multiline value={planDraft.offsiteScope} onChange={v=>setPlanDraft({...planDraft,offsiteScope:v})}/></div>
              <div className="planning-grid three"><InputField label="Security Consultant" value={planDraft.securityConsultant} onChange={v=>setPlanDraft({...planDraft,securityConsultant:v})}/><InputField label="Revision" value={planDraft.proposalRevision} onChange={v=>setPlanDraft({...planDraft,proposalRevision:v})}/><InputField label="Prepared by" value={planDraft.preparedBy} onChange={v=>setPlanDraft({...planDraft,preparedBy:v})}/></div>
              <div className="planning-actions"><button className="primary-button" type="submit" disabled={saving||clearingHeader}><Save size={14}/>{saving?"Saving...":"Save Manloading Plan"}</button><button className="secondary-button" type="button" onClick={()=>{setClearHeaderError("");setClearHeaderOpen(true);}} disabled={saving||clearingHeader}><Eraser size={14}/>Clear Manloading Plan</button></div>
            </form>
          </section>

          <section className="panel planning-panel">
            <div className="panel-heading"><div><h3>Tracking</h3></div></div>
            {phaseRows.some(row=>{const a=readAllocations(row.memberAllocations);return Object.keys(a.legacyShared||{}).length>0||(Object.keys(a).length>0&&!a.onsiteSheet&&!a.offsiteSheet)||(!Object.keys(a).length&&Number(row.mandays||0)>0);})&&<div className="planning-gate"><AlertCircle size={15}/><div><b>Existing task totals need worksheet allocation review</b></div></div>}
            <div className="manload-toolbar"><div className="manload-sheet-tabs"><button type="button" className={sheetMode==="onsiteSheet"?"active":""} onClick={()=>setSheetMode("onsiteSheet")}>(First Cert) M-Onsite</button><button type="button" className={sheetMode==="offsiteSheet"?"active":""} onClick={()=>setSheetMode("offsiteSheet")}>(First Cert) M-Offsite</button></div><div>{sections.some(section=>section.dirty)&&<span className="planning-help">Phase duration changes pending</span>}<button className="secondary-button" type="button" onClick={()=>requestClearDays(sheetMode)} disabled={saving||clearingDays||!phaseRows.length}><Eraser size={14}/>Clear worksheet &amp; team names</button></div></div>
            <div className="planning-table-wrap manload-sheet-wrap"><table className="planning-table manload-sheet" onPaste={event=>{const input=event.target.closest("input[data-phase-row]");if(input)pastePhaseCells(event,Number(input.dataset.phaseRow),input.dataset.phaseField);}}>
              <colgroup>{[70,190,130,105,75,72,72,72,72,72,72,72,72].map((width,index)=><col key={index} style={{width:`${width}px`}}/>)}</colgroup>
              <tbody className="manload-workbook-team-header">
                <tr><td colSpan="5"/>{manloadRoleSlots.map((role,slot)=><td colSpan="2" key={slot}><input className="manload-team-name-input" aria-label={`Responsible person for ${manloadTeamDrafts[slot]?.roleTitle||role}`} value={manloadTeamDrafts[slot]?.displayName||""} onChange={event=>setManloadTeamDrafts(current=>current.map((entry,index)=>index===slot?{...entry,displayName:event.target.value}:entry))}/></td>)}</tr>
                <tr><td colSpan="5"/><td colSpan="8" className="manload-group-label">{planDraft.teamGroupLabel||"Quality and Other Standard Planned MD"}</td></tr>
                <tr><td colSpan="5"/>{manloadRoleSlots.map((role,slot)=><td key={slot} colSpan="2"><input className="manload-team-role-input" aria-label={`Role for team slot ${slot+1}`} value={manloadTeamDrafts[slot]?.roleTitle||role} onChange={event=>setManloadTeamDrafts(current=>current.map((entry,index)=>index===slot?{...entry,roleTitle:event.target.value}:entry))}/></td>)}</tr>
              </tbody>
              <tbody><tr className="manload-column-header">{phaseColumns.map(column=><th key={column.key} title={column.title}>{column.label}</th>)}</tr>{sections.flatMap((section,sectionIndex)=>[
                <tr className="manload-section-row" key={section.clientKey}><td/><td><span>{section.section_name}</span></td><td/><td><input className="manload-phase-duration-input" aria-label={`${section.section_name} duration in days`} type="number" min={0} step={1} value={activePhaseDurationId===section.id?section.duration_days:formatManloadDay(section.duration_days)} onFocus={()=>setActivePhaseDurationId(section.id)} onBlur={()=>setActivePhaseDurationId(null)} onChange={event=>updateSection(section.id,"duration_days",event.target.value)}/></td><td/>{phaseColumns.slice(5).map(column=><td key={column.key}/>)}</tr>,...phaseRows.map((row,rowIndex)=>({row,rowIndex})).filter(item=>item.row.sectionId===section.id).map(({row,rowIndex})=><tr key={row.clientKey} className={row.dirty?"manload-dirty":""}>{phaseColumns.map(column=><td key={column.key} className={column.allocationMemberId?"manload-editable-day":"manload-calculated"}>{column.allocationMemberId?<input data-phase-row={rowIndex} data-phase-field={column.key} aria-label={`${column.title}, ${column.allocationMode}, task ${row.phaseCode||rowIndex+1}`} type={column.type} min={0} step={column.step} value={activeAllocationCell===String(row.clientKey)+"|"+column.key?phaseColumnValue(row,column,sheetMode):formatManloadDay(phaseColumnValue(row,column,sheetMode))} onFocus={()=>setActiveAllocationCell(String(row.clientKey)+"|"+column.key)} onBlur={()=>setActiveAllocationCell(null)} onChange={event=>updatePhaseCell(rowIndex,column,event.target.value)}/>:column.allocationMode?<span className="manload-unassigned-slot"/>:<input data-phase-row={rowIndex} data-phase-field={column.key} aria-label={`${column.label}, task ${row.phaseCode||rowIndex+1}`} type={column.type} readOnly value={column.key==="durationDays"?"":column.key==="mandays"?formatManloadDay(phaseColumnValue(row,column,sheetMode)):phaseColumnValue(row,column,sheetMode)}/>}</td>)}</tr>)
              ])}{phaseRows.map((row,rowIndex)=>row.sectionId?null:<tr key={row.clientKey} className={row.dirty?"manload-dirty":""}>{phaseColumns.map(column=><td key={column.key} className={column.allocationMemberId?"manload-editable-day":"manload-calculated"}>{column.allocationMemberId?<input data-phase-row={rowIndex} data-phase-field={column.key} type={column.type} min={0} step={column.step} value={activeAllocationCell===String(row.clientKey)+"|"+column.key?phaseColumnValue(row,column,sheetMode):formatManloadDay(phaseColumnValue(row,column,sheetMode))} onFocus={()=>setActiveAllocationCell(String(row.clientKey)+"|"+column.key)} onBlur={()=>setActiveAllocationCell(null)} onChange={event=>updatePhaseCell(rowIndex,column,event.target.value)}/>:column.allocationMode?<span className="manload-unassigned-slot"/>:<input data-phase-row={rowIndex} data-phase-field={column.key} type={column.type} readOnly value={column.key==="durationDays"?"":column.key==="mandays"?formatManloadDay(phaseColumnValue(row,column,sheetMode)):phaseColumnValue(row,column,sheetMode)}/>}</td>)}</tr>)}{!sections.length&&<tr><td className="manload-empty-row" colSpan={phaseColumns.length}>Import the workbook to load its Phase groups and task rows.</td></tr>}</tbody>
              <tfoot>
                <tr><th/><th>Total Day</th><th/><th>{formatManloadDay(totalDuration)}</th><th>{totalManDays.toFixed(1)}</th>{phaseColumns.slice(5).map(column=><th key={column.key}>{column.allocationMemberId?phaseRows.reduce((sum,row)=>sum+Number(phaseColumnValue(row,column,sheetMode)||0),0).toFixed(1):""}</th>)}</tr>
                <tr><th colSpan="5"/>{Array.from({length:4},(_,slot)=>{const off=phaseColumns[5+slot*2],on=phaseColumns[6+slot*2];const sum=[off,on].reduce((n,column)=>n+(column.allocationMemberId?phaseRows.reduce((s,row)=>s+Number(phaseColumnValue(row,column,sheetMode)||0),0):0),0);return <th key={slot} colSpan="2">{workspace.team?.[slot]?sum.toFixed(1):""}</th>;})}</tr>
                <tr><th/><th colSpan="3">% Man loading</th><th>{totalManDays?"100.00%":""}</th>{Array.from({length:4},(_,slot)=>{const off=phaseColumns[5+slot*2],on=phaseColumns[6+slot*2];const sum=[off,on].reduce((n,column)=>n+(column.allocationMemberId?phaseRows.reduce((s,row)=>s+Number(phaseColumnValue(row,column,sheetMode)||0),0):0),0);return <th key={slot} colSpan="2">{workspace.team?.[slot]&&totalManDays?`${(sum/totalManDays*100).toFixed(2)}%`:""}</th>;})}</tr>
              </tfoot>
            </table></div>
            <div className="planning-actions manload-save-footer"><button className="primary-button" type="button" onClick={()=>saveManloadWorksheet()} disabled={saving}><Save size={14}/>{saving?"Saving...":"Save Tracking"}</button></div>
          </section>
          </fieldset>
          {manloadReadOnly?<section className="panel planning-panel manload-next-step manload-complete-note"><div className="panel-heading"><div><h3>Manloading Plan and Tracking complete</h3></div><CheckCircle2 size={20}/></div><div className="planning-actions manload-bottom-actions"><button className="secondary-button" type="button" onClick={()=>setManloadDownloadConfirmOpen(true)}><ArrowDownToLine size={14}/>Download filled Manload template (.xlsx)</button></div></section>:<section className="panel planning-panel manload-next-step"><div className="panel-heading"><div><h3>Continue to the next step</h3></div></div><div className="planning-actions manload-bottom-actions"><button className="secondary-button" type="button" onClick={()=>setManloadDownloadConfirmOpen(true)}><ArrowDownToLine size={14}/>Download filled Manload template (.xlsx)</button><button className="primary-button" type="button" onClick={()=>saveManloadWorksheet({includeHeader:true,continueToProposal:true})} disabled={saving||!allowedPages.includes("Proposal")}><CheckCircle2 size={14}/>{saving?"Saving Manload...":"Save and continue to Proposal"}</button></div></section>}

        </>}

        {mode!=="setup"&&<section className="panel planning-panel planning-generator">
          <div className="panel-heading"><div><h3>{mode==="kickoff"?"Kickoff Presentation":"Proposal Pack Generator"}</h3><p>Generate from the confirmed Project Brief, saved plan, schedule and selected project team.</p></div><Sparkles size={17}/></div>
          {!briefApproved&&<div className="planning-gate"><AlertCircle size={15}/><div><b>Project Brief confirmation required</b><p>Confirm the Project Brief before generating planning documents.</p>{allowedPages.includes("Audit Report")&&<button className="text-button" onClick={()=>navigate("Audit Report")}>Open Audit Report</button>}</div></div>}
          <div className="planning-form">
            <div className="planning-grid two"><label className="planning-field">Document type<select value={documentType} onChange={e=>{setDocumentType(e.target.value);setAiConsent(false);}}>{documentTypes.map(t=><option key={t} value={t}>{documentLabels[t]}</option>)}</select></label><div className="planning-readiness"><b>Planning data</b><span>{briefApproved?"Brief confirmed":"Brief needs confirmation"} · Manload saved · {selectedTeamProfiles.length} selected team members · {workspace.phases?.length||0} phases</span></div></div>
            <label className="planning-consent"><input type="checkbox" checked={aiConsent} onChange={e=>setAiConsent(e.target.checked)}/><span>I confirm this project's planning data and any team details used for this draft are approved for processing by the configured AI provider.</span></label>
            <div className="planning-actions"><button className="primary-button" type="button" onClick={generateDocument} disabled={generating||!aiConsent||!briefApproved}><Sparkles size={14}/>{generating?"Generating...":`Generate ${documentLabels[documentType]||"document"} with AI`}</button><button className="secondary-button" type="button" onClick={downloadTemplate} disabled={templateExporting||!briefApproved}><ArrowDownToLine size={14}/>{templateExporting?"Creating template...":`Download filled ${documentLabels[documentType]||"document"} template (.${documentExportFormats[documentType]})`}</button><span>The template download fills this project's saved fields without AI. AI generation still needs an active API balance.</span></div>
          </div>
        </section>}

        {mode!=="setup"&&<section className="panel planning-panel">
          <div className="panel-heading"><div><h3>{mode==="setup"?"Manload Draft History":mode==="kickoff"?"Kickoff Draft History":"Proposal Pack Draft History"}</h3><p>Saved to this project with a review status.</p></div><span className="planning-count">{visibleDocuments.length} drafts</span></div>
          {!visibleDocuments.length?<div className="empty-state planning-empty"><FileText size={22}/><b>No drafts yet</b><span>Approved project inputs will appear in generated planning documents.</span></div>:<div className="planning-doc-list">{visibleDocuments.map(d=><article className="planning-document" key={d.id}>
            <div className="planning-document-heading"><div><small>{documentLabels[d.document_type]} · {d.created_at}</small><h4>{d.title}</h4></div><span className={`planning-state ${d.review_status==="Issued"?"approved":"pending"}`}>{d.review_status}</span></div>
            <pre>{d.content_markdown}</pre>
            <div className="planning-actions"><button className="secondary-button" onClick={()=>downloadDocument(d)}><ArrowDownToLine size={14}/> Download .md</button>{documentExportFormats[d.document_type]&&<a className="secondary-button" href={`/api/planning/documents/${d.id}/export/${documentExportFormats[d.document_type]}`}><ArrowDownToLine size={14}/> Export .{documentExportFormats[d.document_type]}</a>}{canReview&&d.review_status==="Draft"&&<button className="secondary-button" onClick={()=>updateDocumentStatus(d,"Reviewed")}><CheckCircle2 size={14}/> Mark reviewed</button>}{canReview&&d.review_status==="Reviewed"&&<button className="primary-button" onClick={()=>updateDocumentStatus(d,"Issued")}><Check size={14}/> Mark issued</button>}</div>
          </article>)}</div>}
        </section>}
        {mode!=="setup"&&<ProjectDocumentSources category={sourceCategory} project={workspace.project} userRole={userRole} userId={userId}/>}
      </>}
    </>}
    {clearDaysScope&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!clearingDays){setClearDaysScope(null);setClearDaysError("");}}}>
      <section className="modal project-delete-modal" role="dialog" aria-modal="true" aria-labelledby="clear-manload-days-title">
        <div className="modal-heading"><div><small>MANLOAD WORKSHEET</small><h2 id="clear-manload-days-title">Clear worksheet data and names?</h2></div><button className="icon-button" type="button" aria-label="Close confirmation" disabled={clearingDays} onClick={()=>{setClearDaysScope(null);setClearDaysError("");}}><X size={16}/></button></div>
        {clearDaysError&&<div className="auth-error planning-alert">{clearDaysError}</div>}
        <div className="modal-actions"><button className="secondary-button" type="button" disabled={clearingDays} onClick={()=>{setClearDaysScope(null);setClearDaysError("");}}>Cancel</button><button className="primary-button project-delete-confirm" type="button" disabled={clearingDays} onClick={confirmClearDays}><Eraser size={14}/>{clearingDays?"Clearing...":"Clear worksheet & names"}</button></div>
      </section>
    </div>}
    {clearHeaderOpen&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!clearingHeader){setClearHeaderOpen(false);setClearHeaderError("");}}}>
      <section className="modal project-delete-modal" role="dialog" aria-modal="true" aria-labelledby="clear-manload-header-title">
        <div className="modal-heading"><div><small>MANLOAD HEADER</small><h2 id="clear-manload-header-title">Clear Manload header fields?</h2></div><button className="icon-button" type="button" aria-label="Close confirmation" disabled={clearingHeader} onClick={()=>{setClearHeaderOpen(false);setClearHeaderError("");}}><X size={16}/></button></div>
        {clearHeaderError&&<div className="auth-error planning-alert">{clearHeaderError}</div>}
        <div className="modal-actions"><button className="secondary-button" type="button" disabled={clearingHeader} onClick={()=>{setClearHeaderOpen(false);setClearHeaderError("");}}>Cancel</button><button className="primary-button project-delete-confirm" type="button" disabled={clearingHeader} onClick={confirmClearHeader}><Eraser size={14}/>{clearingHeader?"Clearing...":"Clear header fields"}</button></div>
      </section>
    </div>}
    {manloadDownloadConfirmOpen&&<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget)setManloadDownloadConfirmOpen(false);}}>
      <section className="modal project-delete-modal" role="dialog" aria-modal="true" aria-labelledby="download-manload-title">
        <div className="modal-heading"><div><small>MANLOAD WORKBOOK</small><h2 id="download-manload-title">Download Manloading Plan and Tracking?</h2></div><button className="icon-button" type="button" aria-label="Close confirmation" onClick={()=>setManloadDownloadConfirmOpen(false)}><X size={16}/></button></div>
        <div className="modal-actions"><button className="secondary-button" type="button" onClick={()=>setManloadDownloadConfirmOpen(false)}>Cancel</button><button className="primary-button" type="button" onClick={confirmManloadDownload}><ArrowDownToLine size={14}/>Download XLSX</button></div>
      </section>
    </div>}
  </section>;
}

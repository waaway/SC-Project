import ExcelJS from "exceljs";
import mammoth from "mammoth";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import pptxgen from "pptxgenjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { masterTemplateFields } from "../shared/masterTemplateFields.js";
import { orderManloadTeam } from "../shared/manload.js";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";

export const projectDocumentTypes = {
  manload: { label: "Manload", category: "manload", page: "Manload", format: "xlsx", importOnly: true },
  proposal: { label: "Technical Proposal", category: "proposal", page: "Proposal", format: "docx", importOnly: true },
  org_chart: { label: "Organization Chart", category: "proposal", page: "Proposal", format: "pptx", importOnly: true },
  timeline: { label: "Project Timeline", category: "proposal", page: "Proposal", format: "xlsx", importOnly: true },
  team_profile: { label: "Team Profile", category: "proposal", page: "Proposal", format: "docx", importOnly: true },
  kickoff: { label: "Kickoff Presentation", category: "kickoff", page: "Kick-off", format: "pptx", importOnly: true },
  audit_plan: { label: "Audit Plan", category: "audit", page: "Audit Checklist", format: "docx" },
  audit_checklist: { label: "Audit Checklist", category: "audit", page: "Audit Checklist", format: "xlsx" },
  audit_note: { label: "Audit Note", category: "audit", page: "Audit Checklist", format: "docx" },
  audit_report: { label: "Audit Report", category: "report", page: "Audit Report", format: "docx" },
  car_form: { label: "Corrective Action Request Form", category: "report", page: "Audit Report", format: "xlsx" },
  isms_manual: { label: "ISMS Manual", category: "policy", page: "Policy", format: "docx" },
  policy: { label: "IT Security Policy", category: "policy", page: "Policy", format: "docx" },
  procedure: { label: "Internal Audit Procedure", category: "policy", page: "Policy", format: "docx" },
  user_access_procedure: { label: "User Access Management Procedure", category: "policy", page: "Policy", format: "docx" },
  close_meeting: { label: "Close Meeting Slide - Audit Summary", category: "close", page: "Close Meeting", format: "pptx" }
};

export const projectDocumentCategories = {
  manload: { page: "Manload", types: ["manload"] },
  proposal: { page: "Proposal", types: ["proposal", "org_chart", "timeline", "team_profile"] },
  kickoff: { page: "Kick-off", types: ["kickoff"] },
  audit: { page: "Audit Checklist", types: ["audit_plan", "audit_checklist", "audit_note"] },
  report: { page: "Audit Report", types: ["audit_report", "car_form"] },
  close: { page: "Close Meeting", types: ["close_meeting"] },
  policy: { page: "Policy", types: ["isms_manual", "policy", "procedure", "user_access_procedure"] }
};

export const projectDocumentFields = {
  audit_plan: ["documentCode", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "standard", "objective", "scope", "criteria", "method", "locations", "auditDates", "auditTeam", "auditeeContact", "agenda", "risks", "references"],
  audit_report: ["documentCode", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "standard", "objective", "scope", "criteria", "method", "auditDates", "locations", "auditTeam", "auditeeContact", "findingsSummary", "findingDetails", "conclusion", "recommendations", "reviewerChecklist", "references"],
  car_form: ["documentCode", "revision", "issueDate", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "standard", "auditDates", "controlReference", "classification", "department", "findingTitle", "evidence", "evidenceSource", "impact", "rootCause", "correction", "correctiveAction", "actionOwner", "dueDate", "actualImplementationDate", "implementationEvidence", "concernedManager", "effectivenessCheck", "effectivenessDate"],
  audit_checklist: ["documentCode", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "standard", "scope", "locations", "auditeeContact", "auditDates", "checklistItems", "references"],
  audit_note: ["documentCode", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "sessionDate", "session", "department", "participants", "controlReference", "evidence", "observations", "openQuestions", "followUp"],
  isms_manual: ["documentCode", "title", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "purpose", "scope", "responsibilities", "reviewCycle", "references", "templateValues"],
  policy: ["documentCode", "title", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "purpose", "scope", "policyStatement", "responsibilities", "reviewCycle", "references", "templateValues"],
  procedure: ["documentCode", "title", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "purpose", "scope", "responsibilities", "entryCriteria", "procedureSteps", "exitCriteria", "schedule", "records", "reviewCycle", "references", "templateValues"],
  user_access_procedure: ["documentCode", "title", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "purpose", "scope", "responsibilities", "entryCriteria", "procedureSteps", "exitCriteria", "schedule", "records", "reviewCycle", "references", "templateValues"],
  close_meeting: ["documentCode", "revision", "effectiveDate", "reviewDate", "classification", "preparedBy", "preparedDate", "reviewedBy", "reviewedDate", "approvedBy", "approvedDate", "meetingDate", "engagement", "objective", "scope", "resultsSummary", "findingsSummary", "decisions", "nextSteps", "ownersAndDates"]
};

export const projectDocumentFieldLabels = {
  standard: "Audit standard",
  objective: "Audit objective",
  scope: "Scope",
  criteria: "Audit criteria",
  method: "Audit method",
  locations: "Locations",
  auditDates: "Audit dates",
  auditTeam: "Audit team",
  auditeeContact: "Auditee / department and contact",
  agenda: "Schedule and agenda",
  risks: "Risks and dependencies",
  references: "References and source documents",
  findingsSummary: "Findings and classification summary",
  findingDetails: "Finding details and references",
  conclusion: "Conclusion",
  recommendations: "Recommendations",
  reviewerChecklist: "Reviewer checklist",
  checklistItems: "Checklist rows (control | topic | question | expected evidence)",
  sessionDate: "Session date and time",
  session: "Session or process",
  department: "Department",
  participants: "Participants",
  controlReference: "Control or requirement reference",
  issueDate: "CAR issue date",
  evidence: "Evidence reviewed",
  evidenceSource: "Evidence source",
  observations: "Auditor notes and observations",
  openQuestions: "Open questions",
  followUp: "Follow-up actions",
  findingTitle: "Finding title",
  rootCause: "Root cause",
  correction: "Correction",
  correctiveAction: "Corrective action",
  actionOwner: "Action owner",
  dueDate: "Due date",
  actualImplementationDate: "Actual implementation date",
  implementationEvidence: "Implementation evidence",
  concernedManager: "Concerned department manager",
  effectivenessDate: "Effectiveness verification date",
  effectivenessCheck: "Effectiveness check",
  documentCode: "Document code and version",
  title: "Document title",
  revision: "Revision",
  effectiveDate: "Effective date",
  reviewDate: "Next review date",
  classification: "Classification",
  preparedBy: "Prepared by",
  preparedDate: "Prepared date",
  reviewedBy: "Reviewed by",
  reviewedDate: "Review date",
  approvedBy: "Approved by",
  approvedDate: "Approval date",
  purpose: "Purpose",
  policyStatement: "Policy statement",
  responsibilities: "Roles and responsibilities",
  reviewCycle: "Approval and review cycle",
  procedureSteps: "Procedure steps",
  records: "Records and retention",
  entryCriteria: "Entry criteria",
  exitCriteria: "Exit criteria",
  schedule: "Schedule and review frequency",
  meetingDate: "Meeting date",
  engagement: "Engagement and attendees",
  resultsSummary: "Audit summary",
  findingsSummary: "Confirmed findings and classification counts",
  decisions: "Decisions and open items",
  nextSteps: "Next steps",
  ownersAndDates: "Owners and due dates"
};

const allowedExtensions = new Set([".docx", ".xlsx", ".pptx", ".pdf"]);
const MAX_UNPACKED_BYTES = 32 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 1000;
const MAX_EXTRACTED_CHARACTERS = 180000;
const templateDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "templates");
const masterTemplateKeyByDocumentType = { isms_manual: "isms_manual", policy: "security_policy", procedure: "internal_audit_procedure", user_access_procedure: "user_access_procedure" };

function decodeXml(text) {
  return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function cleanText(text) {
  return String(text || "")
    .replace(/\u0000/g, "")
    .replace(/\r/g, "")
    .replace(/[\t ]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_EXTRACTED_CHARACTERS);
}

function validateZipContainer(buffer) {
  let end = -1;
  const lowerBound = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= lowerBound; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) { end = offset; break; }
  }
  if (end < 0) throw new Error("invalid_archive");
  const entryCount = buffer.readUInt16LE(end + 10);
  const directorySize = buffer.readUInt32LE(end + 12);
  const directoryOffset = buffer.readUInt32LE(end + 16);
  if (entryCount < 1 || entryCount > MAX_ARCHIVE_ENTRIES || directoryOffset + directorySize > end) throw new Error("unsafe_archive");
  let cursor = directoryOffset;
  let unpackedBytes = 0;
  for (let i = 0; i < entryCount; i++) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) throw new Error("invalid_archive");
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    if (uncompressedSize === 0xffffffff) throw new Error("unsupported_archive");
    unpackedBytes += uncompressedSize;
    if (unpackedBytes > MAX_UNPACKED_BYTES) throw new Error("unsafe_archive");
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor > directoryOffset + directorySize) throw new Error("invalid_archive");
}

function xmlAttribute(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return decodeXml(tag.match(new RegExp(`\\b${escaped}=["']([^"']*)["']`))?.[1] || "");
}

function resolveWorksheetPath(target) {
  const parts = target.startsWith("/") ? [] : ["xl"];
  for (const part of target.replace(/^\/+/,"").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part);
  }
  return parts.join("/");
}

function spreadsheetCellText(xml, sharedStrings) {
  const type = xmlAttribute(xml.slice(0,xml.indexOf(">")+1),"t");
  if (type === "inlineStr") return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(match=>decodeXml(match[1])).join("");
  const value = decodeXml(xml.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/)?.[1] || "");
  if (type === "s") return sharedStrings[Number(value)] || "";
  if (type === "b") return value === "1" ? "TRUE" : value === "0" ? "FALSE" : value;
  return value;
}

async function extractXlsxText(zip) {
  const workbookXml = await zip.file("xl/workbook.xml").async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string") || "";
  const sharedXml = await zip.file("xl/sharedStrings.xml")?.async("string") || "";
  const sharedStrings = [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(si=>[...si[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(t=>decodeXml(t[1])).join(""));
  const relationships = new Map([...relsXml.matchAll(/<Relationship\b[^>]*\/?\s*>/g)].map(match=>[xmlAttribute(match[0],"Id"),resolveWorksheetPath(xmlAttribute(match[0],"Target"))]));
  const sheets = [...workbookXml.matchAll(/<sheet\b[^>]*\/?\s*>/g)].slice(0,30);
  const chunks = [];
  let cellCount = 0;
  for (const sheet of sheets) {
    const sheetName = xmlAttribute(sheet[0],"name") || "Sheet";
    const relationshipId = xmlAttribute(sheet[0],"r:id");
    const worksheetPath = relationships.get(relationshipId);
    const worksheet = worksheetPath && zip.file(worksheetPath);
    if (!worksheet) continue;
    chunks.push(`## Sheet: ${sheetName}`);
    const sheetXml = await worksheet.async("string");
    for (const rowMatch of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      if (cellCount >= 20000) break;
      const values = [];
      for (const cellMatch of rowMatch[1].matchAll(/<c\b[^>]*>[\s\S]*?<\/c>|<c\b[^>]*\/>/g)) {
        const cellXml = cellMatch[0];
        values.push(spreadsheetCellText(cellXml,sharedStrings));
        cellCount++;
        if (cellCount >= 20000) break;
      }
      const line = values.map(value=>String(value??"").replace(/[\r\n]+/g," ").trim()).join(" | ").trim();
      if (line.replace(/[|\s]/g,"")) chunks.push(line);
    }
  }
  return { raw: chunks.join("\n"), pages: sheets.length };
}

export function supportedDocumentExtension(filename) {
  const extension = String(filename || "").toLowerCase().match(/\.[a-z0-9]+$/)?.[0] || "";
  return allowedExtensions.has(extension) ? extension : "";
}

export function suggestProjectDocumentType(filename) {
  const value = String(filename || "").toLowerCase().replace(/[_-]+/g, " ");
  if (/isms\s*manual/.test(value)) return "isms_manual";
  if (/user\s*access/.test(value)) return "user_access_procedure";
  if (/internal\s*audit\s*procedure/.test(value)) return "procedure";
  if (/policy/.test(value)) return "policy";
  if (/procedure|process/.test(value)) return "procedure";
  if (/manload|resource\s*plan/.test(value)) return "manload";
  if (/technical\s*proposal|proposal/.test(value)) return "proposal";
  if (/organization\s*chart|org\s*chart/.test(value)) return "org_chart";
  if (/timeline|schedule/.test(value)) return "timeline";
  if (/team\s*profile/.test(value)) return "team_profile";
  if (/kick\s*off|kickoff/.test(value)) return "kickoff";
  if (/audit\s*plan|audit\s*programme/.test(value)) return "audit_plan";
  if (/check\s*list|checklist|ia\s*check/.test(value)) return "audit_checklist";
  if (/audit\s*note|interview\s*note|meeting\s*note/.test(value)) return "audit_note";
  if (/corrective\s*action|\bcar\b/.test(value)) return "car_form";
  if (/audit\s*report|internal\s*audit\s*report/.test(value)) return "audit_report";
  if (/close|closing|audit\s*summary/.test(value)) return "close_meeting";
  return "";
}

export async function extractImportedDocument(buffer, extension) {
  if (extension === ".pdf") {
    if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") throw new Error("invalid_document");
    const parser = new PDFParse({ data: buffer, verbosity: 0 });
    try {
      const result = await parser.getText();
      const raw = String(result.text || "");
      const text = cleanText(raw);
      const pages = Number(result.total || 0);
      return { text, pages, scanned: text.length < Math.max(100,pages*40), truncated: raw.length > MAX_EXTRACTED_CHARACTERS };
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  if (buffer.length < 4 || buffer.subarray(0, 2).toString("ascii") !== "PK") throw new Error("invalid_document");
  validateZipContainer(buffer);
  const zip = await JSZip.loadAsync(buffer, { checkCRC32: false });

  if (extension === ".docx") {
    if (!zip.file("[Content_Types].xml") || !zip.file("word/document.xml")) throw new Error("invalid_document");
    const result = await mammoth.extractRawText({ buffer });
    const raw = String(result.value || "");
    const text = cleanText(raw);
    return { text, pages: null, scanned: !text, truncated: raw.length > MAX_EXTRACTED_CHARACTERS };
  }

  if (extension === ".xlsx") {
    if (!zip.file("xl/workbook.xml")) throw new Error("invalid_document");
    const extracted = await extractXlsxText(zip);
    const text = cleanText(extracted.raw);
    return { text, pages: extracted.pages, scanned: !text, truncated: extracted.raw.length > MAX_EXTRACTED_CHARACTERS };
  }

  if (extension === ".pptx") {
    if (!zip.file("ppt/presentation.xml")) throw new Error("invalid_document");
    const slideFiles = Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1]) - Number(b.match(/slide(\d+)/)?.[1])).slice(0, 80);
    const chunks = [];
    for (let index = 0; index < slideFiles.length; index++) {
      const xml = await zip.file(slideFiles[index]).async("string");
      const texts = [...xml.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g)].map(match => decodeXml(match[1]));
      if (texts.length) chunks.push(`## Slide ${index + 1}\n${texts.join("\n")}`);
    }
    const raw = chunks.join("\n\n");
    const text = cleanText(raw);
    return { text, pages: slideFiles.length, scanned: !text, truncated: raw.length > MAX_EXTRACTED_CHARACTERS };
  }

  throw new Error("unsupported_document");
}

function normalizedLines(value) {
  return String(value || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
}

function contentRows(fields) {
  const rows = Object.entries(fields).filter(([key, value]) => !["sourceDocumentId", "templateValues"].includes(key) && typeof value !== "object" && String(value || "").trim()).map(([key, value]) => [projectDocumentFieldLabels[key] || key, String(value).trim()]);
  for (const [token, value] of Object.entries(fields.templateValues || {})) if (String(value || "").trim()) rows.push([token.replace(/^\[|\]$/g, "").replace(/\s+/g, " "), String(value).trim()]);
  return rows;
}

export function createProjectDocumentMarkdown(type, fields, project) {
  const meta = projectDocumentTypes[type];
  if (!meta) throw new Error("unsupported_document_type");
  const lines = [`# ${meta.label} - Draft`, "", `Project: ${project.name} (${project.id})`, `Client: ${project.client}`, "", "This draft is for internal review. Verify every statement against approved engagement records before use.", ""];
  for (const [label, value] of contentRows(fields).filter(([label]) => !(type === "audit_checklist" && label.startsWith("Checklist rows")))) lines.push(`## ${label}`, "", value, "");
  if (type === "audit_checklist") lines.push("## Checklist rows", "", ...normalizedLines(fields.checklistItems).map(line => `- ${line}`), "");
  return lines.join("\n");
}

function paragraphParts(type, fields, project) {
  const label = projectDocumentTypes[type]?.label || "Project document";
  const children = wordDraftHeader(label,project,fields);
  const add=(heading,value)=>children.push(...wordSection(heading,value));
  if(type==="audit_plan"){
    children.push(new Paragraph({text:"PROJECT DETAIL",heading:HeadingLevel.HEADING_1}),wordTable([["Project Code",project.id,"Audit Standard",fields.standard||"[TO BE COMPLETED]"],["Audit Dates",fields.auditDates||"[TO BE COMPLETED]","Locations",fields.locations||"[TO BE COMPLETED]"]]));
    add("OBJECTIVE",fields.objective);add("SCOPE OF WORK",fields.scope);add("AUDIT CRITERIA AND METHOD",[fields.criteria,fields.method].filter(Boolean).join("\n"));add("AUDIT TEAM AND AUDITEE",[fields.auditTeam,fields.auditeeContact].filter(Boolean).join("\n"));add("AUDIT AGENDA",fields.agenda);add("RISKS AND DEPENDENCIES",fields.risks);add("REFERENCES",fields.references);
  }else if(type==="audit_report"){
    children.push(new Paragraph({text:"AUDIT SUMMARY",heading:HeadingLevel.HEADING_1}),wordTable([["Standard",fields.standard||"[TO BE COMPLETED]","Dates",fields.auditDates||"[TO BE COMPLETED]"],["Scope",fields.scope||"[TO BE COMPLETED]","Locations",fields.locations||"[TO BE COMPLETED]"]]));
    add("OBJECTIVE AND CRITERIA",[fields.objective,fields.criteria,fields.method].filter(Boolean).join("\n"));add("AUDIT TEAM AND AUDITEE",[fields.auditTeam,fields.auditeeContact].filter(Boolean).join("\n"));add("RESULTS AND FINDINGS",[fields.findingsSummary,fields.findingDetails].filter(Boolean).join("\n\n"));add("CONCLUSION",fields.conclusion);add("RECOMMENDATIONS",fields.recommendations);add("REVIEW CHECKLIST",fields.reviewerChecklist);add("REFERENCES AND EVIDENCE SOURCES",fields.references);
  }else if(type==="audit_note"){
    children.push(new Paragraph({text:"SESSION INFORMATION",heading:HeadingLevel.HEADING_1}),wordTable([["Date / Time",fields.sessionDate||"[TO BE COMPLETED]","Session / Process",fields.session||"[TO BE COMPLETED]"],["Department / Auditee",fields.department||"[TO BE COMPLETED]","Requirement",fields.controlReference||"[TO BE COMPLETED]"]]));
    add("PARTICIPANTS",fields.participants);add("EVIDENCE REVIEWED",fields.evidence);add("AUDITOR OBSERVATIONS",fields.observations);add("OPEN QUESTIONS",fields.openQuestions);add("FOLLOW-UP ACTIONS",fields.followUp);
  }else{
    for(const [key,value] of contentRows(fields))add(projectDocumentFieldLabels[key]||key,value);
  }
  children.push(new Paragraph({ text: "Prepared locally from project records. Review against the approved source documents before issue." }));
  return children;
}

async function exportDocx(type, fields, project) {
  const document = new Document({
    creator: "SC Control Center",
    title: `${projectDocumentTypes[type].label} - ${project.name}`,
    sections: [{ children: paragraphParts(type, fields, project) }]
  });
  return Packer.toBuffer(document);
}

function xmlEscape(value) {
  return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}

async function exportMasterTemplateDocx(type, fields, project) {
  const templateKey = masterTemplateKeyByDocumentType[type];
  const template = masterTemplateFields[templateKey];
  if (!template) throw new Error("template_unavailable");
  const filePath = path.join(templateDirectory,template.file);
  if (!fs.existsSync(filePath)) throw new Error("template_unavailable");
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const commonValues = {
    "[DOCUMENT CODE]": fields.documentCode,
    "[REVISION]": fields.revision,
    "[EFFECTIVE DATE]": fields.effectiveDate,
    "[NEXT REVIEW DATE]": fields.reviewDate,
    "[CLASSIFICATION]": fields.classification,
    "[PREPARED BY]": fields.preparedBy,
    "[PREPARED DATE]": fields.preparedDate,
    "[REVIEWED BY]": fields.reviewedBy,
    "[REVIEWED DATE]": fields.reviewedDate,
    "[APPROVED BY]": fields.approvedBy,
    "[APPROVED DATE]": fields.approvedDate,
    "[ORGANISATION NAME]": project.client
  };
  const replacements = new Map();
  for (const { token, label } of template.tokens) {
    const entered = token === "[LOGO]" ? "" : fields.templateValues?.[token];
    const supplied = entered || commonValues[token];
    const value = String(supplied || (token === "[LOGO]" ? "[INSERT APPROVED ORGANISATION LOGO IMAGE]" : `[TO BE COMPLETED: ${label}]`)).slice(0,10000);
    replacements.set(xmlEscape(token),value.split(/\r?\n/).map(xmlEscape).join("</w:t><w:br/><w:t>"));
    if (supplied) {
      const escapedToken = xmlEscape(token);
      for (const name of Object.keys(zip.files)) {
        if (!name.endsWith(".xml") || name.includes("comments")) continue;
        let xml = await zip.file(name).async("string");
        xml = xml.replace(/<w:r\b[\s\S]*?<\/w:r>/g, run => run.includes(escapedToken) ? run.replace(/<w:highlight\b[^>]*\/?\s*>/g, "") : run);
        zip.file(name,xml);
      }
    }
  }
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith(".xml") || name.includes("comments")) continue;
    let xml = await zip.file(name).async("string");
    for (const [token,value] of replacements) xml = xml.split(token).join(value);
    zip.file(name,xml);
  }
  return zip.generateAsync({type:"nodebuffer",compression:"DEFLATE",compressionOptions:{level:6}});
}

async function exportChecklist(fields, project) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SC Control Center";
  workbook.subject = `Project ${project.id}`;
  workbook.title = `Audit Checklist - ${project.name}`;
  workbook.created = new Date();
  const titleStyle = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  const titleFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF163B53" } };
  const headerStyle = { bold: true, color: { argb: "FFFFFFFF" } };
  const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF176B78" } };
  const metadata = [
    ["Project", `${project.name} (${project.id})`, "Client", project.client],
    ["Standard", fields.standard, "Document code / revision", [fields.documentCode, fields.revision].filter(Boolean).join(" / ")],
    ["Audit dates", fields.auditDates, "Classification", fields.classification],
    ["Locations", fields.locations, "Auditee / department", fields.auditeeContact],
    ["Scope", fields.scope, "References", fields.references]
  ];
  const lines = normalizedLines(fields.checklistItems).map(line => {
    const parts = line.split("|").map(part => part.trim());
    return { control: parts[0] || "", requirement: parts[1] || "", question: parts[2] || line, evidence: parts[3] || "", result: parts[4] || "", notes: parts[5] || "" };
  });
  const isAnnex = item => /annex|^(?:a\.)?\s*[5-8](?:[.-]|\s|$)/i.test(item.control);
  const groups = { "Clause 4-10": lines.filter(item => !isAnnex(item)), "Annex 5-8": lines.filter(isAnnex) };
  const clauseEnd = Math.max(7, 6 + groups["Clause 4-10"].length);
  const annexEnd = Math.max(7, 6 + groups["Annex 5-8"].length);
  const dashboard = workbook.addWorksheet("Dashboard", { views: [{ state: "frozen", ySplit: 5 }] });
  dashboard.columns = [{ width: 38 }, { width: 88 }];
  dashboard.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 1, paperSize: 9 };
  dashboard.properties.defaultRowHeight = 22;
  dashboard.mergeCells("A1:B1"); dashboard.getCell("A1").value = "INTERNAL AUDIT CHECKLIST"; dashboard.getCell("A1").font = titleStyle; dashboard.getCell("A1").fill = titleFill;
  dashboard.addRow(["Project", `${project.name} (${project.id})`]);
  dashboard.addRow(["Client", project.client]);
  dashboard.addRow(["Standard", fields.standard || "[TO BE COMPLETED]"]);
  dashboard.addRow(["Audit dates", fields.auditDates || "[TO BE COMPLETED]"]);
  dashboard.addRow(["Document code / revision", [fields.documentCode, fields.revision].filter(Boolean).join(" / ") || "[TO BE COMPLETED]"]);
  dashboard.addRow([]); dashboard.addRow(["CHECKLIST STATUS"]); dashboard.mergeCells("A8:B8"); dashboard.getCell("A8").font = { bold: true, color: { argb: "FFFFFFFF" } }; dashboard.getCell("A8").fill = headerFill;
  dashboard.addRow(["Measure", "Count"]); dashboard.getRow(9).font = headerStyle; dashboard.getRow(9).fill = headerFill;
  dashboard.addRow(["Total checklist items", { formula: `COUNTA('Clause 4-10'!A7:A${clauseEnd})+COUNTA('Annex 5-8'!A7:A${annexEnd})` }]);
  dashboard.addRow(["Conforming", { formula: `COUNTIF('Clause 4-10'!E7:E${clauseEnd},"Conforming")+COUNTIF('Annex 5-8'!E7:E${annexEnd},"Conforming")` }]);
  dashboard.addRow(["Nonconforming", { formula: `COUNTIF('Clause 4-10'!E7:E${clauseEnd},"Nonconforming")+COUNTIF('Annex 5-8'!E7:E${annexEnd},"Nonconforming")` }]);
  dashboard.addRow(["Partial", { formula: `COUNTIF('Clause 4-10'!E7:E${clauseEnd},"Partial")+COUNTIF('Annex 5-8'!E7:E${annexEnd},"Partial")` }]);
  dashboard.addRow(["Open", { formula: `COUNTIF('Clause 4-10'!E7:E${clauseEnd},"Open")+COUNTIF('Annex 5-8'!E7:E${annexEnd},"Open")` }]);
  dashboard.addRow(["Not applicable", { formula: `COUNTIF('Clause 4-10'!E7:E${clauseEnd},"Not applicable")+COUNTIF('Annex 5-8'!E7:E${annexEnd},"Not applicable")` }]);
  dashboard.addRow(["Not assessed", { formula: "B10-SUM(B11:B15)" }]);
  dashboard.addRow(["Prepared by", fields.preparedBy || "[TO BE COMPLETED]"]);
  dashboard.addRow(["Result values", "Conforming / Nonconforming / Partial / Open / Not applicable"]);
  dashboard.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; });
  const scope = workbook.addWorksheet("Scope", { views: [{ state: "frozen", ySplit: 2 }] });
  scope.columns = [{ width: 32 }, { width: 92 }]; scope.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 }; scope.mergeCells("A1:B1"); scope.getCell("A1").value = "AUDIT SCOPE AND DOCUMENT CONTROL"; scope.getCell("A1").font = titleStyle; scope.getCell("A1").fill = titleFill;
  scope.addRow(["Field", "Details"]); scope.getRow(2).font = headerStyle; scope.getRow(2).fill = headerFill;
  for (const [key, value] of metadata.flatMap(([label, first, secondLabel, second]) => [[label, first || "[TO BE COMPLETED]"], [secondLabel, second || "[TO BE COMPLETED]"]])) scope.addRow([key, value]);
  for (const [key, value] of [["Audit team", fields.auditTeam], ["Prepared by / date", [fields.preparedBy, fields.preparedDate].filter(Boolean).join(" / ")], ["Reviewed by / date", [fields.reviewedBy, fields.reviewedDate].filter(Boolean).join(" / ")], ["Approved by / date", [fields.approvedBy, fields.approvedDate].filter(Boolean).join(" / ")]]) scope.addRow([key, value || "[TO BE COMPLETED]"]);
  scope.eachRow((row, number) => { if (number > 2) row.alignment = { vertical: "top", wrapText: true }; });
  for (const [name, items] of Object.entries(groups)) {
    const sheet = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 6 }] });
    sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
    sheet.columns = [{ width: 18 }, { width: 32 }, { width: 56 }, { width: 42 }, { width: 20 }, { width: 48 }];
    sheet.mergeCells("A1:F1"); sheet.getCell("A1").value = `${name.toUpperCase()} — AUDIT CHECKLIST`; sheet.getCell("A1").font = titleStyle; sheet.getCell("A1").fill = titleFill;
    sheet.addRow(["Project", `${project.name} (${project.id})`, "Standard", fields.standard || "[TO BE COMPLETED]", "Dates", fields.auditDates || "[TO BE COMPLETED]"]);
    sheet.addRow(["Location", fields.locations || "[TO BE COMPLETED]", "Auditee", fields.auditeeContact || "[TO BE COMPLETED]", "Auditor", fields.auditTeam || "[TO BE COMPLETED]"]);
    sheet.mergeCells("A4:F4"); sheet.getCell("A4").value = `Scope: ${fields.scope || "[TO BE COMPLETED]"}`;
    sheet.mergeCells("A5:F5"); sheet.getCell("A5").value = `References: ${fields.references || "[TO BE COMPLETED]"}`;
    sheet.addRow(["Control / Clause", "Requirement", "Audit question", "Expected evidence", "Result", "Auditor notes"]);
    sheet.getRow(6).font = headerStyle; sheet.getRow(6).fill = headerFill;
    for (const item of items) sheet.addRow([item.control, item.requirement, item.question, item.evidence, item.result, item.notes]);
    sheet.autoFilter = { from: "A6", to: `F${sheet.rowCount}` };
    sheet.eachRow((row, number) => { row.alignment = { vertical: "top", wrapText: true }; if (number >= 7) row.height = 34; });
  }
  return workbook.xlsx.writeBuffer();
}

async function exportCarForm(fields, project) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SC Control Center";
  workbook.title = `CAR Form - ${project.name}`;
  const titleStyle = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  const titleFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF163B53" } };
  const headerStyle = { bold: true, color: { argb: "FFFFFFFF" } };
  const headerFill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF176B78" } };
  const cover = workbook.addWorksheet("Cover"); cover.columns = [{ width: 34 }, { width: 86 }, { width: 30 }, { width: 54 }];
  cover.mergeCells("A1:D1"); cover.getCell("A1").value = "CORRECTIVE ACTION REQUEST — DRAFT"; cover.getCell("A1").font = titleStyle; cover.getCell("A1").fill = titleFill;
  cover.addRow(["Project", `${project.name} (${project.id})`, "Client", project.client]);
  cover.addRow(["CAR number", fields.documentCode || "[TO BE COMPLETED]", "Issue date", fields.issueDate || "[TO BE COMPLETED]"]);
  cover.addRow(["Standard", fields.standard || "[TO BE COMPLETED]", "Audit dates", fields.auditDates || "[TO BE COMPLETED]"]);
  cover.addRow(["Department", fields.department || "[TO BE COMPLETED]", "Classification", fields.classification || "[TO BE COMPLETED]"]);
  cover.addRow(["Finding title", fields.findingTitle || "[TO BE COMPLETED]", "Control / clause", fields.controlReference || "[TO BE COMPLETED]"]);
  cover.addRow(["Concerned manager", fields.concernedManager || "[TO BE COMPLETED]", "Responsible person", fields.actionOwner || "[TO BE COMPLETED]"]);
  cover.addRow(["Implementation planned", fields.dueDate || "[TO BE COMPLETED]", "Implementation actual", fields.actualImplementationDate || "[TO BE COMPLETED]"]);
  cover.addRow(["Effectiveness verification", fields.effectivenessDate || "[TO BE COMPLETED]", "Revision", fields.revision || "[TO BE COMPLETED]"]);
  cover.addRow(["Draft status", "Internal review required", "Revision", fields.revision || "[TO BE COMPLETED]"]);
  cover.eachRow(row => { row.alignment = { vertical: "top", wrapText: true }; });
  const revision = workbook.addWorksheet("Revision History"); revision.columns = [{ width: 16 }, { width: 22 }, { width: 52 }, { width: 28 }, { width: 28 }, { width: 28 }];
  revision.addRow(["REVISION HISTORY"]); revision.mergeCells("A1:F1"); revision.getCell("A1").font = titleStyle; revision.getCell("A1").fill = titleFill;
  revision.addRow(["Revision", "Date", "Change description", "Prepared by", "Reviewed by", "Approved by"]); revision.getRow(2).font = headerStyle; revision.getRow(2).fill = headerFill;
  revision.addRow([fields.revision || "1.0", fields.issueDate || "[TO BE COMPLETED]", "Initial issue", fields.preparedBy || "[TO BE COMPLETED]", fields.reviewedBy || "[TO BE COMPLETED]", fields.approvedBy || "[TO BE COMPLETED]"]);
  const labels = [
    ["controlReference", "Control or clause"], ["classification", "Classification"], ["department", "Department / process"],
    ["findingTitle", "Finding title"], ["evidence", "Finding / objective evidence"], ["evidenceSource", "Evidence source"], ["impact", "Risk / impact"],
    ["rootCause", "Root cause analysis"], ["correction", "Immediate correction / containment"], ["correctiveAction", "Corrective action plan"],
    ["actionOwner", "Responsible person"], ["concernedManager", "Concerned department manager"], ["dueDate", "Planned implementation date"],
    ["actualImplementationDate", "Actual implementation date"], ["implementationEvidence", "Implementation evidence"],
    ["effectivenessCheck", "Effectiveness review and closure"], ["effectivenessDate", "Effectiveness verification date"]
  ];
  for (let index = 1; index <= 11; index++) {
    const sheet = workbook.addWorksheet(`CAR-IA${String(index).padStart(3, "0")}`, { views: [{ state: "frozen", ySplit: 4 }] });
    sheet.columns = [{ width: 34 }, { width: 92 }]; sheet.mergeCells("A1:B1"); sheet.getCell("A1").value = `CORRECTIVE ACTION REQUEST — CAR-IA${String(index).padStart(3, "0")}`; sheet.getCell("A1").font = titleStyle; sheet.getCell("A1").fill = titleFill;
    sheet.addRow(["Project", `${project.name} (${project.id})`]); sheet.addRow(["Client", project.client]); sheet.addRow(["Field", "Details"]); sheet.getRow(4).font = headerStyle; sheet.getRow(4).fill = headerFill;
    for (const [key, label] of labels) sheet.addRow([label, index === 1 ? fields[key] || "[TO BE COMPLETED]" : ""]);
    sheet.eachRow((row, rowNumber) => { if (rowNumber >= 5) { row.alignment = { vertical: "top", wrapText: true }; row.height = Math.min(96, Math.max(30, String(row.getCell(2).value || "").split(/\r?\n/).length * 18)); } });
  }
  return workbook.xlsx.writeBuffer();
}

function addSlideHeader(pptx, slide, title, page) {
  slide.background = { color: "F5F8FA" };
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.14, line: { color: "176B78", transparency: 100 }, fill: { color: "176B78" } });
  slide.addText(title, { x: 0.65, y: 0.4, w: 12, h: 0.52, fontFace: "Aptos Display", fontSize: 25, bold: true, color: "163B53", margin: 0, breakLine: false, fit: "shrink" });
  slide.addText(`SC CONTROL CENTER  |  ${page}`, { x: 0.65, y: 7.12, w: 12, h: 0.2, fontFace: "Aptos", fontSize: 9, color: "64748B", margin: 0 });
}

async function exportCloseMeeting(fields, project) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "SC Control Center";
  pptx.subject = `Project ${project.id}`;
  pptx.title = `Close Meeting Slide - Audit Summary - ${project.name}`;
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "en-US" };
  const addTextSlide = (title, label, value, index) => {
    const slide = pptx.addSlide();
    addSlideHeader(pptx, slide, title, `SLIDE ${index}`);
    slide.addText(label.toUpperCase(), { x: 0.75, y: 1.35, w: 11.8, h: 0.28, fontFace: "Aptos", fontSize: 11, bold: true, color: "176B78", margin: 0 });
    const text = String(value || "[TO BE COMPLETED]").slice(0, 2600);
    slide.addText(text, { x: 0.75, y: 1.75, w: 11.8, h: 4.9, fontFace: "Aptos", fontSize: 21, color: "243B53", margin: 0.08, breakLine: false, valign: "top", fit: "shrink", paraSpaceAfterPt: 10 });
    return slide;
  };
  const cover = pptx.addSlide();
  cover.background = { color: "163B53" };
  cover.addShape(pptx.ShapeType.rect, { x: 0.7, y: 0.8, w: 0.12, h: 5.7, line: { color: "55C2B3", transparency: 100 }, fill: { color: "55C2B3" } });
  cover.addText("CLOSE MEETING", { x: 1.15, y: 1.4, w: 10.9, h: 0.45, fontFace: "Aptos", fontSize: 17, bold: true, color: "71D6C5", charSpacing: 1, margin: 0 });
  cover.addText("Audit Summary", { x: 1.15, y: 2.05, w: 10.9, h: 0.9, fontFace: "Aptos Display", fontSize: 34, bold: true, color: "FFFFFF", margin: 0, fit: "shrink" });
  cover.addText(String(fields.engagement || project.name).slice(0, 500), { x: 1.15, y: 3.35, w: 10.7, h: 0.65, fontFace: "Aptos", fontSize: 23, color: "E5EEF3", margin: 0, fit: "shrink" });
  cover.addText(`${project.client}  |  ${fields.meetingDate || "Date to be confirmed"}  |  ${project.id}`, { x: 1.15, y: 4.25, w: 10.7, h: 0.45, fontFace: "Aptos", fontSize: 15, color: "C7D6DF", margin: 0, fit: "shrink" });
  cover.addText("DRAFT - REVIEW BEFORE PRESENTATION", { x: 1.15, y: 5.9, w: 10.7, h: 0.28, fontFace: "Aptos", fontSize: 11, bold: true, color: "F6D18B", margin: 0 });
  addTextSlide("Engagement summary", "Objective and scope", [fields.objective, fields.scope].filter(Boolean).join("\n\n"), 2);
  addTextSlide("Audit results", "Summary of verified results", fields.resultsSummary, 3);
  addTextSlide("Findings and decisions", "Confirmed findings and open decisions", [fields.findingsSummary, fields.decisions].filter(Boolean).join("\n\n"), 4);
  addTextSlide("Next steps", "Actions, owners, and dates", [fields.nextSteps, fields.ownersAndDates].filter(Boolean).join("\n\n"), 5);
  return pptx.write({ outputType: "nodebuffer" });
}

export async function exportProjectDocument(type, fields, project, format) {
  if (projectDocumentTypes[type]?.importOnly || format !== projectDocumentTypes[type]?.format) throw new Error("unsupported_export_format");
  if (type === "car_form" && format === "xlsx") return { buffer: await exportCarForm(fields,project), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
  if (masterTemplateKeyByDocumentType[type] && format === "docx") return { buffer: await exportMasterTemplateDocx(type,fields,project), mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx" };
  if (format === "docx") return { buffer: await exportDocx(type, fields, project), mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx" };
  if (format === "xlsx") return { buffer: await exportChecklist(fields, project), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
  if (format === "pptx") return { buffer: await exportCloseMeeting(fields, project), mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: "pptx" };
  throw new Error("unsupported_export_format");
}

function wordCell(value, bold = false) {
  const text = String(value ?? "[TO BE COMPLETED]");
  const paragraphs = text.split(/\r?\n/).map(line => new Paragraph({ children: [new TextRun({ text: line || " ", bold })] }));
  return new TableCell({ children: paragraphs });
}

function wordTable(rows) {
  return new Table({ rows: rows.map(row => new TableRow({ children: row.map((value,index) => wordCell(value,index === 0)) })), width: { size: 100, type: WidthType.PERCENTAGE } });
}

function wordSection(title, value) {
  return [new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 }), ...(String(value || "[TO BE COMPLETED]").split(/\r?\n/).filter(Boolean).map(line => new Paragraph({ text: line })))];
}

function wordDraftHeader(title, project, fields) {
  return [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: "DRAFT — Review before issue", bold: true, color: "9A5B00" })] }),
    wordTable([
      ["Project Code", project.id, "Document Code", fields.documentCode || "[TO BE COMPLETED]"],
      ["Project", project.name, "Client", project.client],
      ["Revision", fields.revision || "1.0", "Effective Date", fields.effectiveDate || "[TO BE COMPLETED]"],
      ["Review Date", fields.reviewDate || "[TO BE COMPLETED]", "Classification", fields.classification || "[TO BE COMPLETED]"]
    ]),
    new Paragraph({ text: " " })
  ];
}

function planningWordChildren(type, data) {
  const { project, brief = {}, plan = {}, phases = [], team = [] } = data;
  const title = type === "proposal" ? "Technical Proposal" : "Team Profile";
  const fields = { documentCode: type === "proposal" ? plan.proposal_revision : "TP-" + project.id, revision: plan.proposal_revision || "1.0", effectiveDate: brief.audit_start || "", reviewDate: "", classification: "Internal" };
  const children = wordDraftHeader(title,project,fields);
  const pushSection = (heading,value) => children.push(...wordSection(heading,value));
  if (type === "proposal") {
    children.push(new Paragraph({ text: "PROJECT DETAIL", heading: HeadingLevel.HEADING_1 }));
    children.push(wordTable([["Service", brief.service_name || "[TO BE COMPLETED]", "Audit standard", brief.standard || "[TO BE COMPLETED]"], ["Project duration", `${plan.planned_duration_days || "[TO BE COMPLETED]"} days`, "Delivery mode", plan.delivery_mode || "[TO BE COMPLETED]"], ["In-scope headcount", plan.in_scope_headcount ?? "[TO BE COMPLETED]", "Languages", [plan.communications_language,plan.document_language].filter(Boolean).join(" / ") || "[TO BE COMPLETED]"]]));
    pushSection("SCOPE OF WORK",brief.project_scope || plan.service_summary);
    pushSection("COMPANY BACKGROUND",plan.consultant_profile);
    children.push(new Paragraph({ text: "KEY CONTACT PERSON", heading: HeadingLevel.HEADING_1 }));
    children.push(wordTable([["Name",plan.proposal_contact_name || "[TO BE COMPLETED]","Role",plan.proposal_contact_role || "[TO BE COMPLETED]"],["Phone",plan.proposal_contact_phone || "[TO BE COMPLETED]","Email",plan.proposal_contact_email || "[TO BE COMPLETED]"]]));
    for (let index=0;index<4;index++) {
      const phase=phases[index];
      const phaseRows=phase?[["Code",phase.phase_code,"Activity",phase.phase_name],["Dates",[phase.start_date,phase.end_date].filter(Boolean).join(" – ") || "[TO BE COMPLETED]","Duration / mandays",`${phase.duration_days} days / ${phase.mandays} MD`],["Responsible team",phase.responsible_members || "[TO BE COMPLETED]","Delivery",`${phase.onsite_days} onsite / ${phase.offsite_days} offsite days`]]:[["Code","[TO BE COMPLETED]","Activity","[TO BE COMPLETED]"]];
      children.push(new Paragraph({ text: `PHASE ${index+1}`, heading: HeadingLevel.HEADING_2 }),wordTable(phaseRows));
    }
    pushSection("PROJECT MANAGEMENT APPROACH",[plan.delivery_mode,plan.assumptions,plan.payment_terms].filter(Boolean).join("\n"));
    children.push(new Paragraph({ text: "PROJECT ORGANIZATION CHART", heading: HeadingLevel.HEADING_1 }));
    children.push(wordTable([["Name","Project Role"],...team.map(member=>[member.display_name,member.role_title])]));
    children.push(new Paragraph({ text: "PROJECT TIMELINE", heading: HeadingLevel.HEADING_1 }));
    children.push(wordTable([["Code","Activity","Start","End","Duration","Team"],...phases.map(phase=>[phase.phase_code,phase.phase_name,phase.start_date||"TBD",phase.end_date||"TBD",`${phase.duration_days} days`,phase.responsible_members||""])]));
    pushSection("INFORMATION GATHERING",[plan.in_scope_departments,plan.primary_storage,plan.third_parties].filter(Boolean).join("\n"));
    pushSection("DELIVERABLE",plan.deliverables);
    pushSection("APPENDIX A: (ADDITIONAL DOCUMENTS)",plan.source_reference);
  } else {
    children.push(new Paragraph({ text: "PROJECT TEAM", heading: HeadingLevel.HEADING_1 }));
    team.forEach((member,index)=>{
      children.push(new Paragraph({ text: `${index+1}. ${member.display_name} — ${member.role_title}`, heading: HeadingLevel.HEADING_2 }));
      children.push(wordTable([["Profile",member.biography||"[TO BE COMPLETED]"],["Education",member.education||"[TO BE COMPLETED]"],["Qualifications",member.qualifications||"[TO BE COMPLETED]"],["Relevant experience",member.experience||"[TO BE COMPLETED]"]]));
    });
  }
  children.push(new Paragraph({ text: "Prepared by SC Control Center from the selected project records. Verify all facts and approvals before issue.", spacing: { before: 240 } }));
  return children;
}

async function exportPlanningDocx(type,data) {
  const title=type==="proposal"?"Technical Proposal":"Team Profile";
  return Packer.toBuffer(new Document({creator:"SC Control Center",title:`${title} - ${data.project.name}`,sections:[{children:planningWordChildren(type,data)}]}));
}

function planningWorkbookBase(workbook,title,project) {
  workbook.creator="SC Control Center";workbook.title=`${title} - ${project.name}`;workbook.subject=`Project ${project.id}`;workbook.created=new Date();
}

function planningPhaseTeam(phase,team) {
  try {
    const allocations=JSON.parse(phase.member_allocations||"{}");
    const names=team.filter(member=>{
      const onsite=allocations.onsiteSheet?.[String(member.id)]||{},offsite=allocations.offsiteSheet?.[String(member.id)]||{},legacy=allocations.legacyShared?.[String(member.id)]||{};
      return Number(onsite.offsiteDays||0)>0||Number(onsite.onsiteDays||0)>0||Number(offsite.offsiteDays||0)>0||Number(offsite.onsiteDays||0)>0||Number(legacy.offsiteDays||0)>0||Number(legacy.onsiteDays||0)>0;
    }).map(member=>member.display_name);
    if(names.length)return names.join(", ");
  } catch {}
  return phase.responsible_members||"";
}

function applySheetTemplate(sheet,title,project,brief,plan,columnCount=8) {
  const columns=Math.max(8,columnCount);
  sheet.columns=Array.from({length:columns},(_,index)=>({width:[20,34,20,34,16,20,18,24][index]||18}));
  sheet.mergeCells(1,1,1,columns);sheet.getCell("A1").value=`${title.toUpperCase()} — DRAFT`;
  sheet.getCell("A1").font={bold:true,size:16,color:{argb:"FFFFFFFF"}};sheet.getCell("A1").fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF163B53"}};sheet.getCell("A1").alignment={vertical:"middle"};sheet.getRow(1).height=28;
  sheet.addRow(["Customer Name",project.client,"Project code",project.id,"Date",new Date().toISOString().slice(0,10),"Revision",plan.proposal_revision||"1.0"]);
  sheet.addRow(["Project Name",project.name,"Service Name",brief.service_name||plan.service_summary||"[TO BE COMPLETED]","Prepared by",plan.prepared_by||"[TO BE COMPLETED]","Source",plan.source_reference||"[TO BE COMPLETED]"]);
  sheet.addRow(["Audit / delivery scope",brief.project_scope||plan.service_summary||"[TO BE COMPLETED]"]);
  sheet.mergeCells(4,1,4,columns);sheet.getRow(4).alignment={wrapText:true,vertical:"top"};sheet.getRow(4).height=36;
  for(const row of [2,3,4])sheet.getRow(row).eachCell(cell=>{cell.alignment={...(cell.alignment||{}),vertical:"top",wrapText:true};});
}

async function exportPlanningManload(data) {
  const templatePath=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../Ref/1. SC202512-03-ECQSG-Manload-V1.0.xlsx");
  if(!fs.existsSync(templatePath))throw new Error("The approved Manload XLSX template is missing.");
  const workbook=new ExcelJS.Workbook();await workbook.xlsx.readFile(templatePath);
  workbook.creator="SC Control Center";workbook.lastModifiedBy="SC Control Center";workbook.calcProperties={...(workbook.calcProperties||{}),fullCalcOnLoad:true,forceFullCalc:true};
  const team=orderManloadTeam(Array.isArray(data.team)?data.team:[]);
  if(team.length>4)throw new Error("The Manload template has four team member slots; reduce the selected team to four or fewer before exporting.");
  const sections=Array.isArray(data.sections)?data.sections:[];
  const phases=Array.isArray(data.phases)?data.phases:[];
  const allAllocations=phases.map(phase=>{try{return JSON.parse(phase.member_allocations||"{}");}catch{return {};}});
  if(allAllocations.some(item=>item.legacyShared&&Object.keys(item.legacyShared).length))throw new Error("Some task allocations use the old shared layout. Review and enter allocations separately on both Manload worksheets first.");
  if(phases.some((phase,index)=>Number(phase.mandays||0)>0&&!Object.keys(allAllocations[index].onsiteSheet||{}).length&&!Object.keys(allAllocations[index].offsiteSheet||{}).length))throw new Error("Some saved task totals have no per-worksheet team allocation. Enter the person-day values on both worksheets before exporting.");
  const sheetSpecs=[
    {name:"(First Cert) M-Onsite",key:"onsiteSheet",scope:data.plan.onsite_scope,date:data.plan.onsite_manload_date},
    {name:"(First Cert) M-Offsite",key:"offsiteSheet",scope:data.plan.offsite_scope,date:data.plan.offsite_manload_date}
  ];
  for(const spec of sheetSpecs){
    const sheet=workbook.getWorksheet(spec.name);
    if(!sheet)throw new Error(`The Manload template is missing worksheet ${spec.name}.`);
    for(let r=2;r<=36;r++)for(let c=1;c<=13;c++){const cell=sheet.getCell(r,c);if(!cell.isMerged||cell.master.address===cell.address)cell.value=null;}
    const set=(cell,value)=>{sheet.getCell(cell).value=value??"";};
    const plan=data.plan;
    const customer=plan.manload_customer_name||"",projectCode=plan.manload_project_code||"",projectName=plan.manload_project_name||"";
    set("B2","Customer Name:");set("C2",customer);set("B3","Project code:");set("C3",projectCode);set("B4","Date:");set("C4",parseIsoDate(spec.date)||"");set("B5","Project Name:");set("C5",projectName);set("B6","Service Name:");set("C6",plan.manload_service_name||"");
    set("B7","Scope of work");set("C7",spec.scope);set("B8","Security Consultant:");set("C8",plan.security_consultant);set("B9","Revision:");set("C9",plan.proposal_revision);set("B10","Prepared by:");set("C10",plan.prepared_by);
    set("F12","Quality and Other Standard Planned MD");
    const headings=["CODE","DESCRIPTION","PAYMENT TERMS","DURATION (DAY)","Manday","OFFSITE","ONSITE","OFFSITE1","ONSITE2","OFFSITE3","ONSITE4","OFFSITE5","ONSITE6"];
    headings.forEach((heading,index)=>set(`${sheet.getColumn(index+1).letter}14`,heading));
    const starts=[6,8,10,12];
    team.forEach((member,index)=>{const col=starts[index];set(`${sheet.getColumn(col).letter}11`,member.display_name);set(`${sheet.getColumn(col).letter}13`,member.role_title);});
    const outputRows=[];
    for(const section of sections){outputRows.push({kind:"section",section});for(const phase of phases.filter(item=>item.section_id===section.id))outputRows.push({kind:"task",phase});}
    const extraRows=Math.max(0,outputRows.length-19);
    if(extraRows)sheet.insertRows(34,Array.from({length:extraRows},()=>[]));
    outputRows.forEach((item,index)=>{
      const rowNumber=15+index,row=sheet.getRow(rowNumber),sourceRow=sheet.getRow(item.kind==="section"?15:16);
      for(let c=1;c<=13;c++){const target=row.getCell(c),source=sourceRow.getCell(c);target.style=structuredClone(source.style);target.numFmt=source.numFmt;}
      if(item.kind==="section"){
        set(`B${rowNumber}`,item.section.section_name);set(`D${rowNumber}`,Number(item.section.duration_days||0));
      }else{
        const p=item.phase,allocation=allAllocations[phases.indexOf(p)][spec.key]||{};
        const values=[p.phase_code,p.phase_name,p.payment_terms||"",null,null];
        team.forEach(member=>{const a=allocation[String(member.id)];values.push(a?(a.offsiteDays===""?"":Number(a.offsiteDays||0)):"",a?(a.onsiteDays===""?"":Number(a.onsiteDays||0)):"");});
        values.forEach((value,index)=>{if(index!==3&&index!==4)set(`${sheet.getColumn(index+1).letter}${rowNumber}`,value);});
        set(`E${rowNumber}`,{formula:`SUM(F${rowNumber}:M${rowNumber})`});
      }
    });
    const bodyLast=33+extraRows,totalDay=34+extraRows,personTotal=35+extraRows,loading=36+extraRows;
    const tableColumns=headings;
    for(const wrapper of Object.values(sheet.tables||{})){if(wrapper?.table){wrapper.table.tableRef=`A14:M${bodyLast}`;wrapper.table.autoFilterRef=`A14:M${bodyLast}`;wrapper.table.headerRow=true;wrapper.table.totalsRow=false;wrapper.table.columns=tableColumns.map(name=>({name}));}}
    set(`B${totalDay}`,"Total Day");set(`D${totalDay}`,{formula:`SUM(D15:D${bodyLast})`});set(`E${totalDay}`,{formula:`SUM(E15:E${bodyLast})`});
    for(let index=0;index<4;index++){const c=6+index*2,letter=sheet.getColumn(c).letter,right=sheet.getColumn(c+1).letter;set(`${letter}${totalDay}`,{formula:`SUM(${letter}15:${letter}${bodyLast})`});set(`${right}${totalDay}`,{formula:`SUM(${right}15:${right}${bodyLast})`});set(`${letter}${personTotal}`,{formula:`${letter}${totalDay}+${right}${totalDay}`});set(`${letter}${loading}`,{formula:`IFERROR(${letter}${personTotal}/$E$${totalDay},0)`});}
    set(`B${loading}`,"% Man loading");
    for(const col of ["C","D","E","F","G","H","I","J","K","L","M"])sheet.getColumn(col).width=col==="C"?32:col==="D"?14:col==="E"?12:13;
  }
  const yellowFills=new Set(["FFFFFF00","FFFF00","00FFFF00"]);
  for(const sheet of workbook.worksheets)sheet.eachRow({includeEmpty:true},row=>row.eachCell({includeEmpty:true},cell=>{
    const fill=cell.fill,color=String(fill?.fgColor?.argb||"").toUpperCase();
    if(fill?.type==="pattern"&&fill.pattern==="solid"&&yellowFills.has(color))cell.fill={type:"pattern",pattern:"none"};
  }));
  const output=await workbook.xlsx.writeBuffer();
  const zip=await JSZip.loadAsync(output);
  const tablePaths=Object.keys(zip.files).filter(file=>/^xl\/tables\/table\d+\.xml$/.test(file));
  for(const file of tablePaths){
    const xml=await zip.file(file).async("string");
    const repaired=xml.replace(/<table\b([^>]*)>/,(_match,attributes)=>{
      const clean=attributes.replace(/\s+(?:totalsRowShown|totalsRowCount|headerRowCount)="[^"]*"/g,"");
      return `<table${clean} headerRowCount="1" totalsRowShown="0">`;
    });
    zip.file(file,repaired);
  }
  return zip.generateAsync({type:"nodebuffer",compression:"DEFLATE"});
}

export async function parseManloadWorkbook(base64,{requireMatchingTeamLists=true}={}) {
  const encoded=String(base64||"").replace(/^data:.*?;base64,/,"");
  if(!encoded||encoded.length>18_000_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded))throw new Error("Choose a valid .xlsx file smaller than 13 MB.");
  const workbook=new ExcelJS.Workbook();
  try{await workbook.xlsx.load(Buffer.from(encoded,"base64"));}catch{throw new Error("This file could not be read as an Excel workbook.");}
  const required=["(First Cert) M-Onsite","(First Cert) M-Offsite"];
  if(workbook.worksheets.length!==2)throw new Error("The workbook must contain exactly the two Manload worksheets from the source template.");
  if(required.some(name=>!workbook.getWorksheet(name)))throw new Error("The workbook must contain both source sheets: (First Cert) M-Onsite and (First Cert) M-Offsite.");
  const scalar=value=>{
    if(value&&typeof value==="object"&&"result" in value)value=value.result;
    else if(value&&typeof value==="object"&&(Object.hasOwn(value,"formula")||Object.hasOwn(value,"sharedFormula")))return "";
    if(value&&typeof value==="object"&&Array.isArray(value.richText))return value.richText.map(part=>part.text||"").join("");
    if(value&&typeof value==="object"&&"text" in value)return value.text||"";
    return value??"";
  };
  const cellText=value=>String(scalar(value));
  const text=value=>cellText(value).trim();
  const bounded=(value,label,max)=>{const result=cellText(value);if(result.length>max)throw new Error(`${label} exceeds the ${max}-character limit of the Manload web field.`);return result;};
  const formattedText=cell=>{
    const raw=scalar(cell.value),format=String(cell.numFmt||"").split(";")[0],decimals=format.match(/\.(0+)/)?.[1]?.length;
    if(typeof raw==="number"&&decimals!==undefined)return raw.toFixed(decimals);
    return cellText(cell.value);
  };
  const number=(value,label,{integer=false,max=100000}={})=>{
    const raw=scalar(value);if(raw==null||raw==="")return 0;
    const parsed=Number(raw);if(!Number.isFinite(parsed)||parsed<0||parsed>max||integer&&!Number.isInteger(parsed))throw new Error(`${label} must be a non-negative ${integer?"whole number":"number"} within the allowed range.`);
    return parsed;
  };
  const date=value=>{
    const raw=scalar(value);if(!raw)return "";
    if(raw instanceof Date&&!Number.isNaN(raw.valueOf()))return raw.toISOString().slice(0,10);
    const string=String(raw).trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(string)&&!Number.isNaN(Date.parse(`${string}T00:00:00Z`)))return string;
    const parsed=new Date(string);if(!Number.isNaN(parsed.valueOf()))return parsed.toISOString().slice(0,10);
    throw new Error(`Could not read worksheet date “${string}”.`);
  };
  const parsedSheets=[];
  for(const sheetName of required){
    const sheet=workbook.getWorksheet(sheetName);
    let extraColumnValue=false;
    sheet.eachRow(row=>row.eachCell({includeEmpty:false},(cell,column)=>{if(column>13&&text(cell.value))extraColumnValue=true;}));
    if(extraColumnValue)throw new Error(`${sheetName} contains data outside columns A:M, which the web Manload form cannot represent.`);
    const labels={B2:"Customer Name:",B3:"Project code:",B4:"Date:",B5:"Project Name:",B6:"Service Name:",B7:"Scope of work",B8:"Security Consultant:",B9:"Revision:",B10:"Prepared by:",A14:"CODE",B14:"DESCRIPTION",C14:"PAYMENT TERMS",D14:"DURATION (DAY)",E14:"Manday",F12:"Quality and Other Standard Planned MD"};
    for(const [address,expected] of Object.entries(labels))if(text(sheet.getCell(address).value).toUpperCase()!==expected.toUpperCase())throw new Error(`${sheetName} does not match the Manload template at ${address}.`);
    const allocationHeadings=["OFFSITE","ONSITE","OFFSITE1","ONSITE2","OFFSITE3","ONSITE4","OFFSITE5","ONSITE6"];
    allocationHeadings.forEach((expected,index)=>{const address=sheet.getColumn(index+6).letter+"14";if(text(sheet.getCell(address).value).toUpperCase()!==expected)throw new Error(`${sheetName} has an unexpected team allocation heading at ${address}.`);});
    const team=[];
    for(let slot=0;slot<4;slot++){
      const col=6+slot*2,name=bounded(sheet.getCell(11,col).value,`${sheetName} team name`,180).trim(),role=bounded(sheet.getCell(13,col).value,`${sheetName} team role`,180).trim();
      if(!name&&!role)continue;
      team.push({name,role,slot});
    }
    const namedMembers=team.filter(member=>member.name.trim());
    if(new Set(namedMembers.map(member=>member.name.trim().replace(/\s+/g," ").toLocaleLowerCase())).size!==namedMembers.length)throw new Error(`${sheetName} contains duplicate team member names.`);
    const sections=[];let current=null;
    for(let rowNumber=15;rowNumber<=sheet.rowCount;rowNumber++){
      const row=sheet.getRow(rowNumber),code=bounded(row.getCell(1).value,`${sheetName} row ${rowNumber} Code`,24),description=bounded(row.getCell(2).value,`${sheetName} row ${rowNumber} Description`,240),paymentTerms=bounded(row.getCell(3).value,`${sheetName} row ${rowNumber} Payment Terms`,2000),durationRaw=scalar(row.getCell(4).value);
      if(description.trim().toLowerCase()==="total day"||description.trim().toLowerCase()==="% man loading")break;
      if(!code.trim()&&description.trim()&&durationRaw!==""&&Number.isFinite(Number(durationRaw))){
        current={name:bounded(description,`${sheetName} row ${rowNumber} Phase group name`,120),durationDays:number(durationRaw,`${sheetName} row ${rowNumber} duration`,{integer:true,max:5000}),tasks:[]};sections.push(current);continue;
      }
      if(!code.trim()&&!description.trim())continue;
      if(!current)throw new Error(`${sheetName} row ${rowNumber} has a task before the first Phase group.`);
      if(!code||!description)throw new Error(`${sheetName} row ${rowNumber} needs both Code and Description.`);
      const allocations={};
      for(const member of team){const col=6+member.slot*2,offsiteRaw=scalar(row.getCell(col).value),onsiteRaw=scalar(row.getCell(col+1).value),offsite=number(offsiteRaw,`${sheetName} row ${rowNumber} ${member.name||`team slot ${member.slot+1}`} OFFSITE`),onsite=number(onsiteRaw,`${sheetName} row ${rowNumber} ${member.name||`team slot ${member.slot+1}`} ONSITE`),allocationKey=member.name.trim()||`[Unnamed slot ${member.slot+1}]`;if(offsite!==0||onsite!==0||offsiteRaw!==""||onsiteRaw!=="")allocations[allocationKey]={offsiteDays:offsiteRaw===""?"":offsite,onsiteDays:onsiteRaw===""?"":onsite};}
      for(let slot=0;slot<4;slot++)if(!team.some(member=>member.slot===slot)){
        const col=6+slot*2,offsiteRaw=scalar(row.getCell(col).value),onsiteRaw=scalar(row.getCell(col+1).value);
        if([offsiteRaw,onsiteRaw].some(value=>value!==""&&!(Number.isFinite(Number(value))&&Number(value)===0))){
          const offsite=number(offsiteRaw,`${sheetName} row ${rowNumber} team slot ${slot+1} OFFSITE`),onsite=number(onsiteRaw,`${sheetName} row ${rowNumber} team slot ${slot+1} ONSITE`);
          allocations[`[Unnamed slot ${slot+1}]`] ={offsiteDays:offsiteRaw===""?"":offsite,onsiteDays:onsiteRaw===""?"":onsite};
          team.push({name:"",role:"",slot});
        }
      }
      const calculatedManday=Object.values(allocations).reduce((sum,item)=>sum+Number(item.offsiteDays||0)+Number(item.onsiteDays||0),0),mandayCell=row.getCell(5).value,mandayValue=scalar(mandayCell),hasMandayFormula=Boolean(mandayCell&&typeof mandayCell==="object"&&(Object.hasOwn(mandayCell,"formula")||Object.hasOwn(mandayCell,"sharedFormula")));
      if(mandayValue!==""&&!Number.isFinite(Number(mandayValue)))throw new Error(`${sheetName} row ${rowNumber} Manday must be a calculated number.`);
      if(mandayValue!==""&&Math.abs(Number(mandayValue)-calculatedManday)>0.0001)throw new Error(`${sheetName} row ${rowNumber} Manday does not equal its team allocation total.`);
      if(mandayValue===""&&!hasMandayFormula&&calculatedManday>0)throw new Error(`${sheetName} row ${rowNumber} has allocated days but no Manday formula.`);
      current.tasks.push({code,description,paymentTerms,allocations});
    }
    parsedSheets.push({
      name:sheetName,
      customer:bounded(sheet.getCell("C2").value,`${sheetName} Customer Name`,160),
      projectCode:bounded(sheet.getCell("C3").value,`${sheetName} Project code`,80),
      date:date(sheet.getCell("C4").value),
      projectName:bounded(sheet.getCell("C5").value,`${sheetName} Project Name`,160),
      serviceName:bounded(sheet.getCell("C6").value,`${sheetName} Service Name`,500),
      scope:bounded(sheet.getCell("C7").value,`${sheetName} Scope of work`,5000),
      securityConsultant:bounded(sheet.getCell("C8").value,`${sheetName} Security Consultant`,240),
      revision:bounded(formattedText(sheet.getCell("C9")),`${sheetName} Revision`,40),
      preparedBy:bounded(sheet.getCell("C10").value,`${sheetName} Prepared by`,180),
      team,sections
    });
  }
  const [onsite,offsite]=parsedSheets;
  const identityFields=["customer","projectCode","projectName","serviceName","securityConsultant","revision","preparedBy"];
  const sharedHeader={};
  const headerConflicts=[];
  for(const field of identityFields){
    const onsiteValue=String(onsite[field]||"").trim(),offsiteValue=String(offsite[field]||"").trim();
    if(onsiteValue&&offsiteValue&&onsiteValue!==offsiteValue)headerConflicts.push(field);
    sharedHeader[field]=onsiteValue||offsiteValue||"";
  }
  if(headerConflicts.length)throw new Error(`The two worksheets contain conflicting shared header values: ${headerConflicts.join(", ")}. Clear or match those fields before importing.`);
  const normalizeTeamText=value=>String(value||"").trim().replace(/\s+/g," ").toLocaleLowerCase();
  const teamValue=value=>["","-","–","—"].includes(String(value||"").trim())?"":String(value).trim().replace(/\s+/g," ");
  const mergedTeam=onsite.team.map(member=>({...member,name:teamValue(member.name),role:teamValue(member.role),key:`slot:${member.slot+1}`})),teamConflicts=[];
  for(const offsiteMember of offsite.team){
    const target=mergedTeam.find(member=>member.slot===offsiteMember.slot);
    if(!target){mergedTeam.push({...offsiteMember,name:teamValue(offsiteMember.name),role:teamValue(offsiteMember.role),key:`slot:${offsiteMember.slot+1}`});continue;}
    const onsiteName=teamValue(target.name),offsiteName=teamValue(offsiteMember.name),onsiteRole=teamValue(target.role),offsiteRole=teamValue(offsiteMember.role);
    if(onsiteName&&offsiteName&&normalizeTeamText(onsiteName)!==normalizeTeamText(offsiteName))teamConflicts.push(`slot ${offsiteMember.slot+1}: ${onsiteName} / ${offsiteName}`);
    if(onsiteRole&&offsiteRole&&normalizeTeamText(onsiteRole)!==normalizeTeamText(offsiteRole))teamConflicts.push(`${onsiteName||offsiteName||`slot ${offsiteMember.slot+1}`} has roles “${onsiteRole}” / “${offsiteRole}”`);
    target.name=onsiteName||offsiteName;
    target.role=onsiteRole||offsiteRole;
  }
  if(requireMatchingTeamLists&&teamConflicts.length)throw new Error(`The two worksheets contain conflicting team data (${teamConflicts.join("; ")}). Fill missing fields where possible or make conflicting names/roles match before importing.`);
  if(mergedTeam.length>4)throw new Error("The worksheets contain more than four distinct team slots, which the Manload template cannot represent.");
  const structure=sheet=>sheet.sections.map(section=>({name:section.name,durationDays:section.durationDays,tasks:section.tasks.map(task=>({code:task.code,description:task.description,paymentTerms:task.paymentTerms}))}));
  if(JSON.stringify(structure(onsite))!==JSON.stringify(structure(offsite)))throw new Error("The Phase groups or task rows differ between the two worksheets. They must match because the web stores one shared task list with separate sheet allocations.");
  const allTasks=onsite.sections.flatMap(section=>section.tasks);
  if(allTasks.some(task=>!task.code||!task.description))throw new Error("Every task row must have a Code and Description.");
  const codes=allTasks.map(task=>task.code.trim().toLocaleLowerCase());
  if(new Set(codes).size!==codes.length)throw new Error("Task codes must be unique within the workbook.");
  const groupNames=onsite.sections.map(section=>section.name.trim().toLocaleLowerCase());
  if(new Set(groupNames).size!==groupNames.length)throw new Error("Phase group names must be unique across the two worksheets.");
  return {projectIdentity:{customer:sharedHeader.customer,projectCode:sharedHeader.projectCode,projectName:sharedHeader.projectName},team:mergedTeam.sort((left,right)=>left.slot-right.slot).map(({name,role,slot,key})=>({name,role,slot,key})),header:{serviceName:sharedHeader.serviceName,revision:sharedHeader.revision,preparedBy:sharedHeader.preparedBy,securityConsultant:sharedHeader.securityConsultant},sheets:{onsite:{date:onsite.date,scope:onsite.scope,sections:onsite.sections},offsite:{date:offsite.date,scope:offsite.scope,sections:offsite.sections}}};
}

function parseIsoDate(value) { if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||"")))return null;const date=new Date(`${value}T00:00:00.000Z`);return Number.isNaN(date.valueOf())?null:date; }

async function exportPlanningTimeline(data) {
  const workbook=new ExcelJS.Workbook();planningWorkbookBase(workbook,"Project Timeline",data.project);
  const sheet=workbook.addWorksheet("Project Timeline",{views:[{state:"frozen",ySplit:6}]});applySheetTemplate(sheet,"Project Timeline",data.project,data.brief,data.plan);
  sheet.addRow([]);sheet.addRow(["CODE","DESCRIPTION","RELEVANT DEPARTMENTS","START DATE","END DATE","DURATION (WORKING DAYS)","RESPONSIBLE TEAM"]);
  const header=sheet.getRow(6);header.font={bold:true,color:{argb:"FFFFFFFF"}};header.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF176B78"}};header.alignment={wrapText:true,vertical:"middle"};
  for(const phase of data.phases)sheet.addRow([phase.phase_code,phase.phase_name,data.plan.in_scope_departments||"",parseIsoDate(phase.start_date),parseIsoDate(phase.end_date),phase.duration_days,planningPhaseTeam(phase,data.team||[])]);
  sheet.columns=[{width:14},{width:40},{width:34},{width:16},{width:16},{width:22},{width:30}];
  for(let row=7;row<=sheet.rowCount;row++){sheet.getCell(`D${row}`).numFmt="dd-mmm-yyyy";sheet.getCell(`E${row}`).numFmt="dd-mmm-yyyy";sheet.getRow(row).alignment={vertical:"top",wrapText:true};sheet.getRow(row).height=30;}
  sheet.autoFilter={from:"A6",to:`G${sheet.rowCount}`};
  const dated=data.phases.map(p=>({start:parseIsoDate(p.start_date),end:parseIsoDate(p.end_date)})).filter(p=>p.start&&p.end);
  const first=dated.length?new Date(Math.min(...dated.map(p=>p.start.getTime()))):parseIsoDate(data.brief.audit_start)||new Date();
  const last=dated.length?new Date(Math.max(...dated.map(p=>p.end.getTime()))):new Date(first.getTime()+6*86400000);
  const weeks=Math.max(1,Math.min(52,Math.ceil((last-first)/604800000)+1));
  const gantt=workbook.addWorksheet("Gantt",{views:[{state:"frozen",xSplit:2,ySplit:2}]});gantt.columns=[{width:14},{width:36},...Array.from({length:weeks},()=>({width:12}))];gantt.mergeCells(1,1,1,weeks+2);gantt.getCell(1,1).value=`PROJECT TIMELINE — ${data.project.name}`;gantt.getCell(1,1).font={bold:true,size:16,color:{argb:"FFFFFFFF"}};gantt.getCell(1,1).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF163B53"}};
  gantt.getCell(2,1).value="CODE";gantt.getCell(2,2).value="ACTIVITY";
  for(let week=0;week<weeks;week++){const start=new Date(first.getTime()+week*604800000);gantt.getCell(2,week+3).value=`W${week+1}\n${start.toISOString().slice(0,10)}`;}
  gantt.getRow(2).font={bold:true,color:{argb:"FFFFFFFF"}};gantt.getRow(2).fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF176B78"}};gantt.getRow(2).alignment={wrapText:true,vertical:"middle"};
  data.phases.forEach((phase,index)=>{const row=index+3;gantt.getCell(row,1).value=phase.phase_code;gantt.getCell(row,2).value=phase.phase_name;const start=parseIsoDate(phase.start_date),end=parseIsoDate(phase.end_date);for(let week=0;week<weeks;week++){const weekStart=new Date(first.getTime()+week*604800000),weekEnd=new Date(weekStart.getTime()+6*86400000);if(start&&end&&start<=weekEnd&&end>=weekStart){const c=gantt.getCell(row,week+3);c.value=" ";c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF55C2B3"}};}}});
  return workbook.xlsx.writeBuffer();
}

function addPlanningSlideHeader(pptx,slide,title,index){slide.background={color:"F5F8FA"};slide.addShape(pptx.ShapeType.rect,{x:0,y:0,w:13.333,h:0.14,line:{color:"176B78",transparency:100},fill:{color:"176B78"}});slide.addText(title,{x:0.65,y:0.38,w:12,h:0.55,fontFace:"Aptos Display",fontSize:25,bold:true,color:"163B53",margin:0,fit:"shrink"});slide.addText(`PROJECT ${index}  |  SC CONTROL CENTER`,{x:0.65,y:7.12,w:12,h:0.18,fontFace:"Aptos",fontSize:9,color:"64748B",margin:0});}
function planningCover(pptx,title,data){const slide=pptx.addSlide();slide.background={color:"163B53"};slide.addShape(pptx.ShapeType.rect,{x:0.7,y:0.8,w:0.12,h:5.7,line:{color:"55C2B3",transparency:100},fill:{color:"55C2B3"}});slide.addText(title.toUpperCase(),{x:1.15,y:1.3,w:10.8,h:0.5,fontFace:"Aptos",fontSize:16,bold:true,color:"71D6C5",charSpacing:1,margin:0});slide.addText(data.project.name,{x:1.15,y:2.0,w:10.8,h:1.0,fontFace:"Aptos Display",fontSize:34,bold:true,color:"FFFFFF",margin:0,fit:"shrink"});slide.addText(`${data.project.client}  |  ${data.project.id}`,{x:1.15,y:3.25,w:10.8,h:0.5,fontFace:"Aptos",fontSize:18,color:"DCE8ED",margin:0,fit:"shrink"});slide.addText("DRAFT — INTERNAL REVIEW REQUIRED",{x:1.15,y:5.9,w:10.8,h:0.3,fontFace:"Aptos",fontSize:11,bold:true,color:"F6D18B",margin:0});return slide;}

async function exportPlanningPptx(type,data) {
  const pptx=new pptxgen();pptx.layout="LAYOUT_WIDE";pptx.author="SC Control Center";pptx.subject=`Project ${data.project.id}`;pptx.theme={headFontFace:"Aptos Display",bodyFontFace:"Aptos",lang:"en-US"};
  const title=type==="org_chart"?"Project Organization Chart":"Project Kick-off";pptx.title=`${title} - ${data.project.name}`;planningCover(pptx,title,data);
  let index=2;
  const textSlide=(heading,label,value)=>{const slide=pptx.addSlide();addPlanningSlideHeader(pptx,slide,heading,index++);slide.addText(label.toUpperCase(),{x:0.75,y:1.25,w:11.8,h:0.28,fontFace:"Aptos",fontSize:11,bold:true,color:"176B78",margin:0});slide.addText(String(value||"[TO BE COMPLETED]").slice(0,4000),{x:0.75,y:1.7,w:11.8,h:4.95,fontFace:"Aptos",fontSize:21,color:"243B53",margin:0.08,valign:"top",fit:"shrink"});return slide;};
  if(type==="org_chart"){
    const slide=pptx.addSlide();addPlanningSlideHeader(pptx,slide,"PROJECT TEAM AND REPORTING LINES",index++);const members=data.team.slice(0,12);const width=3.5,gap=0.35,startX=(13.333-(Math.min(3,members.length)*width+(Math.min(3,members.length)-1)*gap))/2;
    members.forEach((m,i)=>{const col=i%3,row=Math.floor(i/3),x=startX+col*(width+gap),y=1.35+row*1.55;slide.addShape(pptx.ShapeType.rect,{x,y,w:width,h:1.15,rectRadius:0.06,line:{color:"B8CBD6",width:1},fill:{color:row===0?"E8F4F3":"FFFFFF"}});slide.addText(m.display_name,{x:x+0.12,y:y+0.14,w:width-0.24,h:0.3,fontFace:"Aptos",fontSize:15,bold:true,color:"163B53",margin:0,fit:"shrink"});slide.addText(m.role_title,{x:x+0.12,y:y+0.54,w:width-0.24,h:0.42,fontFace:"Aptos",fontSize:12,color:"456274",margin:0,fit:"shrink",valign:"top"});});
    if(!members.length)slide.addText("Add project team members in Manload before exporting the organization chart.",{x:0.9,y:2,w:11,h:1,fontFace:"Aptos",fontSize:18,color:"64748B",margin:0.1});
  } else {
    textSlide("Organization profile","Consultant organization",data.plan.consultant_profile);
    textSlide("Scope Of Work","Objective and scope",[data.brief.service_name,data.brief.project_scope].filter(Boolean).join("\n\n"));
    const timeline=data.phases.map(p=>`${p.phase_code}  ${p.phase_name}  |  ${p.start_date||"TBD"} — ${p.end_date||"TBD"}  |  ${p.duration_days} days`).join("\n");
    textSlide("Project Timeline","Schedule and milestones",timeline);
    textSlide("Project Activities","Activities and delivery mode",[data.plan.service_summary,`Delivery: ${data.plan.delivery_mode||"[TO BE COMPLETED]"}`,`Departments: ${data.plan.in_scope_departments||"[TO BE COMPLETED]"}`].join("\n\n"));
    textSlide("Project Deliverables","Deliverables",data.plan.deliverables);
    textSlide("Team Profile","Selected project team",data.team.map(m=>`${m.display_name} — ${m.role_title}`).join("\n"));
    textSlide("Project Management Approach","Communication, assumptions and dependencies",[data.plan.communications_language,data.plan.assumptions,data.plan.third_parties].filter(Boolean).join("\n\n"));
  }
  return pptx.write({outputType:"nodebuffer"});
}

export async function exportPlanningProjectDocument(type,data) {
  const format={manload:"xlsx",proposal:"docx",org_chart:"pptx",timeline:"xlsx",team_profile:"docx",kickoff:"pptx"}[type];
  if(!format)throw new Error("unsupported_export_format");
  let buffer;
  if(type==="manload")buffer=await exportPlanningManload(data);
  else if(type==="timeline")buffer=await exportPlanningTimeline(data);
  else if(["proposal","team_profile"].includes(type))buffer=await exportPlanningDocx(type,data);
  else buffer=await exportPlanningPptx(type,data);
  const mimeType={docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation"}[format];
  return {buffer,mimeType,extension:format};
}

function parseMarkdownDocument(markdown) {
  const rows = [];
  let heading = "";
  for (const raw of String(markdown || "").split(/\r?\n/).slice(0, 2500)) {
    const line = raw.trim();
    if (!line) continue;
    const title = line.match(/^#{1,6}\s+(.+)$/);
    if (title) { heading = title[1].replace(/[*_`]/g, ""); rows.push({ kind: "heading", text: heading }); continue; }
    if (/^\|?\s*:?-{2,}/.test(line)) continue;
    if (line.includes("|") && line.replace(/[|\s]/g, "")) {
      const cells = line.replace(/^\|/, "").replace(/\|$/, "").split("|").map(cell => cell.trim().replace(/[*_`]/g, ""));
      rows.push({ kind: "table", cells });
      continue;
    }
    const bullet = line.match(/^(?:[-*+]\s+|\d+[.)]\s+)(.+)$/);
    rows.push({ kind: bullet ? "item" : "paragraph", text: (bullet ? bullet[1] : line).replace(/[*_`]/g, "").slice(0, 12000), heading });
  }
  return rows;
}

function createMarkdownDocx(markdown, title, project) {
  const children = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: "DRAFT - Internal review required", bold: true, color: "9A5B00" })] }),
    new Paragraph({ text: `Project: ${project.name} (${project.id})` }),
    new Paragraph({ text: `Client: ${project.client}` })
  ];
  let tableHeaderAdded = false;
  for (const row of parseMarkdownDocument(markdown)) {
    if (row.kind === "heading") {
      tableHeaderAdded = false;
      children.push(new Paragraph({ text: row.text, heading: HeadingLevel.HEADING_1 }));
    } else if (row.kind === "item") {
      children.push(new Paragraph({ text: row.text, bullet: { indent: 360 } }));
    } else if (row.kind === "table") {
      const label = row.cells.join(" | ");
      if (/^\s*[-:| ]+\s*$/.test(label)) continue;
      children.push(new Paragraph({ text: `${tableHeaderAdded ? "" : "Table row: "}${label}`, indent: { left: 240 } }));
      tableHeaderAdded = true;
    } else children.push(new Paragraph({ text: row.text }));
  }
  children.push(new Paragraph({ text: "Review all project facts against the approved source records before issue." }));
  return Packer.toBuffer(new Document({ creator: "SC Control Center", title, sections: [{ children }] }));
}

async function createMarkdownXlsx(markdown, title, project) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SC Control Center";
  workbook.title = title;
  const sheet = workbook.addWorksheet("Document", { views: [{ state: "frozen", ySplit: 4 }] });
  sheet.columns = [{ width: 24 }, { width: 100 }, { width: 48 }, { width: 48 }, { width: 48 }, { width: 48 }];
  sheet.mergeCells("A1:F1");
  sheet.getCell("A1").value = `${title.toUpperCase()} - DRAFT`;
  sheet.getCell("A2").value = `Project: ${project.name} (${project.id})`;
  sheet.getCell("A3").value = `Client: ${project.client}`;
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF163B53" } };
  for (const item of parseMarkdownDocument(markdown)) {
    if (item.kind === "table") sheet.addRow(["Table", ...item.cells.map(value => value.slice(0, 30000))]);
    else sheet.addRow([item.kind === "heading" ? "Section" : item.kind === "item" ? "Item" : "Text", item.text.slice(0, 30000)]);
  }
  sheet.eachRow((row, rowNumber) => { if (rowNumber >= 4) { row.alignment = { vertical: "top", wrapText: true }; if (row.getCell(1).value === "Section") row.font = { bold: true, color: { argb: "FF163B53" } }; } });
  return workbook.xlsx.writeBuffer();
}

async function createMarkdownPptx(markdown, title, project) {
  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "SC Control Center";
  pptx.subject = `Project ${project.id}`;
  pptx.title = title;
  pptx.theme = { headFontFace: "Aptos Display", bodyFontFace: "Aptos", lang: "en-US" };
  const items = parseMarkdownDocument(markdown);
  const cover = pptx.addSlide();
  cover.background = { color: "163B53" };
  cover.addShape(pptx.ShapeType.rect, { x: 0.7, y: 0.8, w: 0.12, h: 5.7, line: { color: "55C2B3", transparency: 100 }, fill: { color: "55C2B3" } });
  cover.addText(title, { x: 1.15, y: 1.4, w: 10.9, h: 1.1, fontFace: "Aptos Display", fontSize: 34, bold: true, color: "FFFFFF", margin: 0, fit: "shrink" });
  cover.addText(`${project.name}  |  ${project.client}  |  ${project.id}`, { x: 1.15, y: 3, w: 10.7, h: 0.6, fontFace: "Aptos", fontSize: 19, color: "DCE8ED", margin: 0, fit: "shrink" });
  cover.addText("DRAFT - REVIEW BEFORE USE", { x: 1.15, y: 5.85, w: 10.7, h: 0.3, fontFace: "Aptos", fontSize: 11, bold: true, color: "F6D18B", margin: 0 });
  const sections = [];
  for (const item of items) {
    if (item.kind === "heading") sections.push({ title: item.text, lines: [] });
    else {
      if (!sections.length) sections.push({ title: "Document summary", lines: [] });
      const text = item.kind === "table" ? item.cells.join(" | ") : item.text;
      sections[sections.length - 1].lines.push(text);
    }
  }
  let slideNumber = 2;
  for (const section of sections) {
    const lines = section.lines.length ? section.lines : ["No content provided."];
    for (let offset = 0; offset < lines.length; offset += 6) {
      const slide = pptx.addSlide();
      addSlideHeader(pptx, slide, section.title.slice(0, 100), `SLIDE ${slideNumber++}`);
      const bullets = lines.slice(offset, offset + 6).map(text => ({ text: text.slice(0, 1500), options: { bullet: { indent: 18 }, hanging: 4, breakLine: true } }));
      slide.addText(bullets, { x: 0.8, y: 1.35, w: 11.7, h: 5.55, fontFace: "Aptos", fontSize: 19, color: "243B53", margin: 0.08, valign: "top", breakLine: false, fit: "shrink", paraSpaceAfterPt: 14 });
    }
    if (slideNumber > 21) break;
  }
  return pptx.write({ outputType: "nodebuffer" });
}

export async function exportMarkdownProjectDocument(markdown, title, project, format) {
  if (format === "docx") return { buffer: await createMarkdownDocx(markdown,title,project), mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx" };
  if (format === "xlsx") return { buffer: await createMarkdownXlsx(markdown,title,project), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
  if (format === "pptx") return { buffer: await createMarkdownPptx(markdown,title,project), mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: "pptx" };
  throw new Error("unsupported_export_format");
}

export function normalizeProjectDocumentFields(type, values) {
  const allowed = projectDocumentFields[type];
  if (!allowed) throw new Error("unsupported_document_type");
  const result = {};
  for (const key of allowed) {
    if (key === "templateValues") {
      const templateKey = masterTemplateKeyByDocumentType[type];
      const accepted = new Set((masterTemplateFields[templateKey]?.tokens || []).map(item=>item.token));
      const provided = values?.templateValues && typeof values.templateValues === "object" && !Array.isArray(values.templateValues) ? values.templateValues : {};
      const templateValues = {};
      for (const token of accepted) {
        const value = String(provided[token] ?? "").trim().slice(0,5000);
        if (value) templateValues[token] = value;
      }
      if (JSON.stringify(templateValues).length > 80000) throw new Error("template_fields_too_large");
      result.templateValues = templateValues;
      continue;
    }
    result[key] = String(values?.[key] ?? "").trim().slice(0, key === "checklistItems" ? 40000 : 12000);
  }
  result.sourceDocumentId = values?.sourceDocumentId == null || values.sourceDocumentId === "" ? null : Number(values.sourceDocumentId);
  if (result.sourceDocumentId !== null && (!Number.isSafeInteger(result.sourceDocumentId) || result.sourceDocumentId < 1)) throw new Error("invalid_source_document");
  if (!allowed.some(key => key === "templateValues" ? Object.keys(result.templateValues || {}).length > 0 : String(result[key] || "").trim())) throw new Error("empty_document");
  return result;
}

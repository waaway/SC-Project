import ExcelJS from "exceljs";
import mammoth from "mammoth";
import JSZip from "jszip";
import { PDFParse } from "pdf-parse";
import pptxgen from "pptxgenjs";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from "docx";

export const projectDocumentTypes = {
  manload: { label: "Manload", category: "mainload", page: "Mainload", format: "xlsx", importOnly: true },
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
  policy: { label: "Policy", category: "policy", page: "Policy", format: "docx" },
  procedure: { label: "Procedure", category: "policy", page: "Policy", format: "docx" },
  close_meeting: { label: "Close Meeting Slide - Audit Summary", category: "close", page: "Close Meeting", format: "pptx" }
};

export const projectDocumentCategories = {
  mainload: { page: "Mainload", types: ["manload"] },
  proposal: { page: "Proposal", types: ["proposal", "org_chart", "timeline", "team_profile"] },
  kickoff: { page: "Kick-off", types: ["kickoff"] },
  audit: { page: "Audit Checklist", types: ["audit_plan", "audit_checklist", "audit_note"] },
  report: { page: "Audit Report", types: ["audit_report", "car_form"] },
  close: { page: "Close Meeting", types: ["close_meeting"] },
  policy: { page: "Policy", types: ["policy", "procedure"] }
};

export const projectDocumentFields = {
  audit_plan: [
    "standard", "objective", "scope", "criteria", "method", "locations", "auditDates", "auditTeam", "agenda", "risks", "references"
  ],
  audit_report: ["standard", "objective", "scope", "criteria", "method", "findingsSummary", "conclusion", "recommendations", "reviewerChecklist", "references"],
  car_form: ["controlReference", "classification", "department", "findingTitle", "evidence", "evidenceSource", "impact", "rootCause", "correction", "correctiveAction", "actionOwner", "dueDate", "effectivenessCheck"],
  audit_checklist: ["standard", "scope", "checklistItems", "references"],
  audit_note: ["sessionDate", "session", "department", "participants", "controlReference", "evidence", "observations", "openQuestions", "followUp"],
  policy: ["documentCode", "title", "purpose", "scope", "policyStatement", "responsibilities", "reviewCycle", "references"],
  procedure: ["documentCode", "title", "purpose", "scope", "responsibilities", "procedureSteps", "records", "reviewCycle", "references"],
  close_meeting: ["meetingDate", "engagement", "objective", "scope", "resultsSummary", "findingsSummary", "decisions", "nextSteps", "ownersAndDates"]
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
  agenda: "Schedule and agenda",
  risks: "Risks and dependencies",
  references: "References and source documents",
  findingsSummary: "Findings and classification summary",
  conclusion: "Conclusion",
  recommendations: "Recommendations",
  reviewerChecklist: "Reviewer checklist",
  checklistItems: "Checklist rows (control | topic | question | expected evidence)",
  sessionDate: "Session date and time",
  session: "Session or process",
  department: "Department",
  participants: "Participants",
  controlReference: "Control or requirement reference",
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
  effectivenessCheck: "Effectiveness check",
  documentCode: "Document code and version",
  title: "Document title",
  purpose: "Purpose",
  policyStatement: "Policy statement",
  responsibilities: "Roles and responsibilities",
  reviewCycle: "Approval and review cycle",
  procedureSteps: "Procedure steps",
  records: "Records and retention",
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
  if (/policy|manual/.test(value)) return "policy";
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
  return Object.entries(fields).filter(([key, value]) => key !== "sourceDocumentId" && String(value || "").trim()).map(([key, value]) => [projectDocumentFieldLabels[key] || key, String(value).trim()]);
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
  const children = [
    new Paragraph({ text: label, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: "DRAFT - Internal review required", bold: true, color: "9A5B00" })] }),
    new Paragraph({ text: `Project: ${project.name} (${project.id})` }),
    new Paragraph({ text: `Client: ${project.client}` })
  ];
  for (const [key, value] of contentRows(fields)) {
    if (key === "Checklist rows") {
      children.push(new Paragraph({ text: key, heading: HeadingLevel.HEADING_1 }));
      for (const line of normalizedLines(value)) children.push(new Paragraph({ text: line, bullet: { indent: 360 } }));
      continue;
    }
    children.push(new Paragraph({ text: key, heading: HeadingLevel.HEADING_1 }));
    for (const line of String(value).split(/\r?\n/).filter(Boolean)) children.push(new Paragraph({ text: line }));
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

async function exportChecklist(fields, project) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SC Control Center";
  workbook.subject = `Project ${project.id}`;
  workbook.title = `Audit Checklist - ${project.name}`;
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Audit Checklist", { views: [{ state: "frozen", ySplit: 5 }] });
  sheet.columns = [
    { header: "Control / Clause", key: "control", width: 20 },
    { header: "Topic", key: "topic", width: 28 },
    { header: "Audit question", key: "question", width: 58 },
    { header: "Expected evidence", key: "evidence", width: 42 },
    { header: "Result", key: "result", width: 18 },
    { header: "Auditor notes", key: "notes", width: 48 }
  ];
  sheet.mergeCells("A1:F1");
  sheet.getCell("A1").value = "AUDIT CHECKLIST - DRAFT";
  sheet.getCell("A2").value = `Project: ${project.name} (${project.id})`;
  sheet.getCell("A3").value = `Client: ${project.client}`;
  sheet.getCell("A4").value = `Standard: ${fields.standard || "To be confirmed"} | Scope: ${fields.scope || "To be confirmed"}`;
  sheet.getRow(5).values = ["Control / Clause", "Topic", "Audit question", "Expected evidence", "Result", "Auditor notes"];
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF163B53" } };
  sheet.getRow(5).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(5).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF176B78" } };
  for (const line of normalizedLines(fields.checklistItems)) {
    const parts = line.split("|").map(part => part.trim());
    sheet.addRow({ control: parts[0] || "", topic: parts[1] || "", question: parts[2] || line, evidence: parts[3] || "", result: "", notes: "" });
  }
  if (sheet.rowCount === 5) sheet.addRow({ control: "", topic: "", question: "Enter an audit question", evidence: "", result: "Not assessed", notes: "" });
  sheet.autoFilter = { from: "A5", to: `F${sheet.rowCount}` };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber >= 6) {
      row.alignment = { vertical: "top", wrapText: true };
      row.height = 34;
    }
  });
  return workbook.xlsx.writeBuffer();
}

async function exportCarForm(fields, project) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SC Control Center";
  workbook.title = `CAR Form - ${project.name}`;
  const sheet = workbook.addWorksheet("CAR Form", { views: [{ state: "frozen", ySplit: 4 }] });
  sheet.columns = [{ width: 34 }, { width: 96 }];
  sheet.mergeCells("A1:B1");
  sheet.getCell("A1").value = "CORRECTIVE ACTION REQUEST - DRAFT";
  sheet.getCell("A2").value = `Project: ${project.name} (${project.id})`;
  sheet.getCell("A3").value = `Client: ${project.client}`;
  sheet.getRow(1).font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF163B53" } };
  sheet.addRow(["Field", "Details"]);
  const labels = [
    ["controlReference", "Control or clause"], ["classification", "Classification"], ["department", "Department"],
    ["findingTitle", "Finding title"], ["evidence", "Objective evidence"], ["evidenceSource", "Evidence source"],
    ["impact", "Impact"], ["rootCause", "Root cause"], ["correction", "Correction"],
    ["correctiveAction", "Corrective action"], ["actionOwner", "Action owner"], ["dueDate", "Due date"],
    ["effectivenessCheck", "Effectiveness check"]
  ];
  for (const [key,label] of labels) sheet.addRow([label,fields[key] || "[TO BE COMPLETED]"]);
  sheet.getRow(4).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(4).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF176B78" } };
  sheet.eachRow((row,rowNumber) => {
    if (rowNumber >= 5) {
      row.alignment = { vertical: "top", wrapText: true };
      row.height = Math.min(96,Math.max(30,String(row.getCell(2).value||"").split(/\r?\n/).length*18));
    }
  });
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
  if (format === "docx") return { buffer: await exportDocx(type, fields, project), mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx" };
  if (format === "xlsx") return { buffer: await exportChecklist(fields, project), mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
  if (format === "pptx") return { buffer: await exportCloseMeeting(fields, project), mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: "pptx" };
  throw new Error("unsupported_export_format");
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
  for (const key of allowed) result[key] = String(values?.[key] ?? "").trim().slice(0, key === "checklistItems" ? 40000 : 12000);
  result.sourceDocumentId = values?.sourceDocumentId == null || values.sourceDocumentId === "" ? null : Number(values.sourceDocumentId);
  if (result.sourceDocumentId !== null && (!Number.isSafeInteger(result.sourceDocumentId) || result.sourceDocumentId < 1)) throw new Error("invalid_source_document");
  if (!allowed.some(key => result[key])) throw new Error("empty_document");
  return result;
}

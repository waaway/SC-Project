# Organization Office template field map

This map describes how the web forms use the Office templates and the structures found in `Ref`. The source examples can contain information from different engagements. Only the generic master templates are copied for generation; example content and client-specific source files are not used as report data. All drafts are stored against the selected project.

## Web form to output mapping

| Web form | Output | Data placement |
| --- | --- | --- |
| Manload | Manload `.xlsx` | Project and customer control fields, revision, phase code/description, mandays, onsite/offsite days, dates, responsible team, and totals. Two worksheets: `M-Onsite` and `M-Offsite`. |
| Proposal | Technical Proposal `.docx` | Project details, scope, company background, contact, phase descriptions, project management, organization chart, timeline, information gathering, deliverables, and appendix/reference. |
| Proposal | Organization Chart `.pptx` | Project title and team member names/roles from the selected project. |
| Proposal | Timeline `.xlsx` | Project metadata, phase code/description, departments, start/end dates, duration, team, and a weekly Gantt view. |
| Proposal | Team Profile `.docx` | Selected project team member profile, education, qualifications, and relevant experience. |
| Kick-off | Kickoff Presentation `.pptx` | Project and organization profile, scope, timeline, activities, deliverables, selected team, and project management fields. |
| Audit Plan | Audit Plan `.docx` | Document control, standard, objective, scope, criteria/method, locations/dates, audit team/auditee, agenda, risks, and references. |
| Audit Checklist | Audit Checklist `.xlsx` | `Dashboard` and `Scope` sheets plus `Clause 4-10` and `Annex 5-8`; checklist rows use control, requirement, question, expected evidence, result, and auditor note. |
| Audit Note | Audit Note `.docx` | Session date/process, department, participants, requirement, evidence, observations, open questions, and follow-up. |
| Audit Report | Audit Report `.docx` | Audit team/auditee, scope and criteria, verified findings, conclusion, recommendations, reviewer checks, and references. |
| CAR Form | CAR `.xlsx` | `Cover`, `Revision History`, and `CAR-IA001` through `CAR-IA011`; finding, evidence, cause, correction, corrective action, owner, planned/actual dates, implementation evidence, and effectiveness check. The entered CAR populates `CAR-IA001`. |
| Close Meeting | Audit Summary `.pptx` | Meeting date, engagement, objective/scope, verified results, findings/decisions, next steps, owners, and dates. |

## Word master templates

The Policy page presents input fields grouped by the placeholders read from each generic master Word document. Entered values replace their matching placeholders while preserving the document's styles, tables, and section layout.

| Web document type | Master Word file | Placeholder groups |
| --- | --- | --- |
| ISMS Manual | `isms_manual.docx` | Document control and approval; organization and scope; governance, risk, audit, management review, training, and records. |
| IT Security Policy | `security_policy.docx` | Document control and approval; organization context; people, physical, technology, supplier, incident, continuity, privacy, vulnerability, and monitoring controls. |
| Internal Audit Procedure | `internal_audit_procedure.docx` | Document control and approval; audit programme ownership, frequency, notice periods, qualifications, reporting, and retention. |
| User Access Management Procedure | `user_access_procedure.docx` | Document control and approval; access request channels/forms, responsible teams, system scope, access review, initial credentials, and revocation periods. |

Blank Word fields remain visibly marked as `[TO BE COMPLETED: field name]`. The logo field remains an explicit image placeholder and must be replaced with the approved logo in Word after export. User-supplied values are plain text; the application does not invent missing controls or policy content.

## Review notes

- No source file or output is sent to the AI provider for these exports.
- Files are generated from data entered for the selected project and use that project's access controls.
- The Audit Note example is scanned and has no selectable text in this local workflow; OCR is not available. Enter its required information in the web form.
- The closing-meeting reference is a PDF, so the generated output uses a structured slide layout based on its purpose and the web fields rather than copying a PowerPoint master.
- Reviewers must validate facts, requirements, formatting, and approvals before issuing a client document.

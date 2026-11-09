# Organization Office template field map

This map describes how the web forms use the Office templates and the structures found in `Ref`. The Manload reference workbook is used as the exact import/export format; its sample cell values are cleared on export and its project-specific values can be imported into the selected web project. Other document outputs use their mapped templates and fields. All records are stored against the selected project.

## Web form to output mapping

| Web form | Output | Data placement |
| --- | --- | --- |
| Manload | Manload `.xlsx` | Uses the supplied `1. SC202512-03-ECQSG-Manload-V1.0.xlsx` as the output workbook and import format. Preserves its two sheet names, `(First Cert) M-Onsite` and `(First Cert) M-Offsite`, its header rows, phase group rows, task rows and total rows. Header cells map to project customer/code/name, the Manload Service Name, each worksheet's own Date and Scope of work, Security Consultant, Revision and Prepared by. Each worksheet has its own member allocation values. Group duration is entered on the Phase row; task rows carry Code, Description, Payment Terms, calculated Manday, and the template's per-member OFFSITE/ONSITE columns. The exporter clears sample engagement values before filling the template. |

### Manload XLSX cell mapping

| Source workbook location | Web value | Notes |
| --- | --- | --- |
| `B2`, `C2:E2` | Customer Name | Editable Manload header value; imported from the workbook. It is not filled from the selected project record. |
| `B3`, `C3:E3` | Project code | Editable Manload header value; imported from the workbook and kept separate from the web application's internal project ID. |
| `B4`, `C4:E4` | Date | Separate date for each worksheet. |
| `B5`, `C5:E5` | Project Name | Editable Manload header value; imported from the workbook. It is not filled from the selected project record. |
| `B6`, `C6:E6` | Service Name | Editable Manload header field; imported from the workbook when importing. |
| `B7`, `C7:E7` | Scope of work | Separate text for each worksheet. The adjacent merged `F7:H7` cells are blank in the source and stay blank. |
| `B8`, `C8:E8`; `B9`, `C9:E9`; `B10`, `C10:E10` | Security Consultant, Revision, Prepared by | Direct matching header fields. Numeric Revision values are read using the cell's decimal display format, so a cell formatted as `0.0` imports as `1.0`. |
| Rows 11 and 13, columns `F:M` | Team member name and project role | Four paired slots in the provided template. |
| Row 12, columns `F:M` | `Quality and Other Standard Planned MD` | Fixed template label. |
| Row 14, columns `A:E` and per-member pairs `F:M` | Column headings | Preserved as in the workbook. |
| Rows 15–33 | Phase group and task rows | Group name and duration map to columns B and D. Task Code, Description and Payment Terms map to A:C. Task Manday is calculated from that worksheet's team values. |
| Rows 34–36 | Total Day, team totals and `% Man loading` | Formulas total group duration, task mandays and per-member values within each worksheet. |

There are no task start/end date columns in this Manload template. The Onsite and Offsite worksheets keep independent allocations; one worksheet is never copied into the other. Blank allocation cells remain blank. The provided template has four paired team slots; export stops if the selected team exceeds that capacity instead of omitting team members. Import checks both worksheets and requires their shared groups, tasks and team list to match before it will load them into the shared web rows. The imported Customer Name, Project code and Project Name remain exact Manload header values even when they differ from the web project's internal record.
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

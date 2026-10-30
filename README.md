# SC Control Center

Internal-workspace prototype for the Security Compliance (SC) team.

## Stack
- React + Vite
- Node.js + Express API
- SQLite via Node's built-in node:sqlite
- bcrypt password hashing
- Database-backed sessions in an HttpOnly, SameSite=Strict cookie
- User roles and per-user page/project access

## Run locally
Requirements: Node.js 22.5+.

```bash
npm install
npm run dev
```

Open http://127.0.0.1:5173.

## Sign in
The first administrator account has been provisioned directly in the local SQLite database. Use the credentials provided to the project owner. Login is sign-in-only; account setup is not exposed in the UI.

## Admin user and access management
Sign in as an admin and open Users & Access in the sidebar.
- Create accounts with a password of at least 12 characters.
- Choose Analyst, Reviewer, or Admin role.
- For non-admin accounts, assign the exact pages and projects they may access.
- New non-admin accounts have no page/project access until the admin grants it.
- Admin accounts have access to all pages and projects.
- Project lists are filtered server-side by the user's project permissions.

## Database
SQLite is stored at data/sc-control-center.sqlite. It contains users, sessions, projects, per-user page access, per-user project access, workflow records, and an audit log. Private document sources are stored under data/project-documents with restricted file permissions. Set `SC_DATA_DIR` to a writable private directory to move the local database, profile pictures, and imported documents together. Do not commit or share this directory.

## Security notes
This is a local development build, not yet approved for production client information.
- The server binds to 127.0.0.1, so it is reachable only from this Mac.
- Company Wi-Fi/LAN-only access requires IT to provision an approved host, firewall rules, HTTPS/TLS, backups and monitoring. Do not change the bind address to 0.0.0.0 on a personal machine as a shortcut.
- Production deployment must use HTTPS and set NODE_ENV=production. The production cookie is marked Secure.
- Review company password, account lifecycle, role, retention, encryption-at-rest and incident-response requirements before onboarding users.
- A password-change screen is not yet implemented; do not reuse the initial admin password elsewhere.
- The workspace starts with no sample projects, clients, tasks, workflow records, or activity events.
- User accounts are retained separately from workflow data. Create real project and workflow records when the relevant modules are ready.
- This is a development prototype. Obtain IT/security approval before entering real client information or deploying it.


## AI Assistant and Audit Workspace

The AI Assistant is available to accounts granted the **AI Assistant** page permission. Its API runs through the Express backend; the provider key must never be placed in frontend code.

### Configure the provider
1. Copy `.env.example` to `.env` in the project root.
2. Set `OPENAI_API_KEY` to an API key managed by the project owner.
3. Optionally set `OPENAI_MODEL` to a model approved for your organization.
4. Restart the server with `npm run dev`.

AI requests are sent to the configured OpenAI API. This may transmit the user's prompt and selected project metadata to the provider. Obtain company approval before using confidential client information, and review provider retention, privacy, and billing settings. Never submit credentials, tokens, or secrets.

### Current scope and limitations
- Phase 1 provides a read-only security assistant for general questions, WSTG guidance, scan-output interpretation, and drafting finding summaries.
- Optional project context is restricted server-side to projects the signed-in user can access.
- AI requests require authentication and the AI Assistant page permission, and are rate-limited.
- The assistant does not execute scans, exploit targets, or run tools.
- The **Audit Report** page now provides a project-specific brief, a structured finding register, and a generated-document history. Access is restricted to users with the Audit Report page and project access.
- The brief must be saved and explicitly confirmed. Findings must include an evidence source and be confirmed before they can be used in a generated document. Editing a brief clears its confirmation.
- The document generator can draft an Audit Report, Closing Meeting Summary, or CAR set from the confirmed brief and confirmed findings. It labels output as a draft and saves Markdown content in the local SQLite database; reviewers can mark a draft Reviewed and then Issued.
- **Manload** stores project-specific service assumptions, departments, workload phases, dates, mandays, onsite/offsite allocation and selected team members. Team profiles are scoped to the project and are not copied from other engagements.
- **Proposal** and **Kick-off** can draft a Manload, Technical Proposal, Organization Chart, Timeline, Team Profile or Kickoff Presentation from the approved brief and plan. The requested draft type must also be available to the signed-in user's page permission.
- The project brief and plan require a source reference. A Reviewer, Manager or Admin confirms the plan; changes to the brief, plan, phases or team clear that confirmation and require review again.
- Planning drafts require a separate per-request confirmation before the approved plan and selected team data are sent to the configured AI provider. Output is saved to the project and follows Draft → Reviewed → Issued status.
- Audit-document requests require a per-request confirmation and send only that project's confirmed brief and findings to the configured AI provider, with `store:false`.
- Planning-document requests separately require a per-request confirmation and send only the approved plan data needed for the selected draft. Full biographies and qualifications are sent only for a Team Profile draft; other planning drafts include names and roles only when needed.
- Source references can now be imported from DOCX, XLSX, PPTX, and PDF files up to 12 MB. Text extraction runs locally; imported originals and text are stored in private, project-scoped storage and are not sent to AI. The user must select the project and type its exact ID before import. Imports that identify another accessible project's ID or client are rejected. Duplicate source files within a project are rejected.
- Project-specific source imports are available on Manload, Proposal, Kick-off, Audit Checklist, Audit Report, Close Meeting, and Policy pages. Imported documents appear only for their owning project and require the corresponding page permission and project access to view or download.
- Structured, no-AI drafts are available for Audit Plan, Audit Checklist, Audit Note, Audit Report, CAR Form, Policy, Procedure, and Close Meeting Summary slides. Drafts can be linked only to an imported source from the same project and follow Draft → Reviewed → Issued review status.
- Planning forms can export editable Manload, Proposal, Organization Chart, Timeline, Team Profile, and Kick-off Office files from the selected project's saved plan and team. Structured Audit Plan, Audit Note, and Audit Report drafts export to DOCX; Checklist and CAR Form drafts export to XLSX; Close Meeting Summary drafts export to PPTX. The Checklist and CAR exports follow the source workbook sheet structure. The Policy page uses sanitized copies of the generic ISMS Manual, IT Security Policy, Internal Audit Procedure, and User Access Procedure Word masters from `server/templates/`; fields are generated from their placeholders and blank fields remain marked for completion. It does not import client example content. See [the organization template field map](docs/organization-template-map.md) for field placement and known limitations.
- PDFs with very little selectable text are flagged for OCR instead of being treated as fully read. OCR is not included yet. Text extraction is capped at 180,000 characters and Office archive expansion at 32 MB; truncated files are clearly marked.
- These import/export features have not had the requested expert review or production security approval. Continue using anonymized samples only until a qualified auditor and company IT/security review the document structure, accuracy, access controls, retention, and deployment setup.
- AI output can be incorrect and must be validated by a qualified assessor before being used in a client deliverable.
- This remains a local development prototype and is not approved for production client data until reviewed by company IT/security.

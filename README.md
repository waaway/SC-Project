# SC Control Center

Internal-workspace prototype for the Security Consulting (SC) team.

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
SQLite is stored at data/sc-control-center.sqlite. It contains users, sessions, projects, per-user page access, per-user project access, and an audit log. Do not commit or share the database file.

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


## AI Assistant (initial implementation)

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
- Assessment records and a Finding database are not implemented yet. Finding Analyzer and multi-step AI Agent workflows are later phases, not enabled features in this release.
- AI output can be incorrect and must be validated by a qualified assessor before being used in a client deliverable.
- This remains a local development prototype and is not approved for production client data until reviewed by company IT/security.

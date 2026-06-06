# Backend API - Interview Genius

This document lists new/important API endpoints and auth notes.

Base URL: `http://localhost:5000`

Important endpoints

- `POST /apply` — submit application (public)
- `GET /applications` — list applications; supports `candidate_email`, `business_email`, `job_id`, `status` query params. Auth enforced for non-public views.
- `GET /applications/:id` — get application details
- `PUT /applications/:id/status` — update status (requires session as job owner or admin)
- `POST /applications/:id/schedule` — schedule interview (requires session as job owner or admin)

- `GET /admin/jobs` — list jobs (admin)
- `PUT /admin/job/:id/status` — approve/reject job (admin only)

- Notifications:
  - `GET /notifications?to={email}&unreadOnly=true` — fetch notifications for a recipient
  - `POST /notifications/:id/read` — mark notification read

- Auth / sessions:
  - Candidate login: `POST /logincand` (sets `req.session.user`)
  - Business login: `POST /loginbuss` (sets `req.session.business`)
  - Admin login: `POST /loginadmin` (sets `req.session.admin=true`)
  - Logout: `POST /auth/logout` (clears session)

Authorization notes
- Admin endpoints require an admin session. Use the admin credentials from `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`).
- Application/job actions are restricted to the business that owns the job (session set at login) or an admin.

Tests
- A test scaffold can be added with `jest` + `supertest`. This repo includes a placeholder for tests — configure a local MongoDB and run tests in CI.

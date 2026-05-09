# Dayawan Village Connect

A simple village service portal where people can:
- Create an account
- Apply for services
- Track application status with a tracking code
- See their submitted requests in a dashboard
- Let admins update request status

This guide is written for **non-technical users** and first-time setup.

---

## 1) What you need before starting

1. A computer with internet
2. A Supabase account (free tier is enough to start)
3. Node.js (version 20 or later)
4. A code editor (VS Code recommended)

---

## 2) Download and install

Open terminal inside the project folder and run:

```bash
npm ci
```

This installs all required frontend packages.

---

## 3) Create backend (Supabase) in 10 steps

1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Wait until the project is ready.
3. In Supabase dashboard, open **SQL Editor**.
4. Open this file from your project:
   - `supabase/schema.sql`
5. Copy all SQL from that file.
6. Paste into Supabase SQL Editor.
7. Click **Run**.
8. In Supabase, open **Project Settings → API**.
9. Copy:
   - Project URL
   - `anon` public key
10. Keep these two values ready for next step.

This SQL creates:
- `services` table (admin-manageable service catalog + dynamic form schema)
- `service_applications` table (status, submitted document metadata, payment metadata)
- `user_profiles` table (editable user details, role assignment, suspension control)
- Supabase Storage bucket `application-documents` for uploaded files
- automatic tracking code generation (`DYW-1201`, `DYW-1202`, …)
- security policies (role-aware access, admin restrictions, suspended-user blocking)
- a bootstrap admin user:
  - email: `admin@dayawan.local`
  - password: `Admin@123` (change immediately in production)

---

## 4) Connect app with backend

1. In the project root, create a file named `.env`.
2. Copy values from `.env.example` and fill them:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_ADMIN_EMAILS=admin@example.com
```

3. Replace `admin@example.com` with real admin emails (comma-separated if many).

Example:
```env
VITE_ADMIN_EMAILS=admin1@dayawan.in,admin2@dayawan.in
```

---

## 5) Start the app locally

```bash
npm run dev
```

Then open the shown URL in browser (usually `http://localhost:5173`).

---

## 6) Admin panel and service management

Admin access is controlled by:
- `VITE_ADMIN_EMAILS` in `.env`
- and/or user role in Supabase JWT metadata (`role: admin`)

Admin panel capabilities:
- Update service title/description/details
- Update required documents and service charges
- Configure payment readiness (`none` / `stripe` / `razorpay`) with dummy payment flow
- Create/edit service-specific form fields used on “Apply” page
- Update application lifecycle status
- Manage users (edit details, role, suspension)
- View uploaded application documents from admin queue

For simple setup, keep admin emails in `.env` and use the bootstrap admin account.

---

## 7) Production deployment (Netlify)

This project already has `netlify.toml`.

1. Push code to GitHub
2. Connect repository in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add Netlify environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAILS`
6. Deploy

SPA redirects are already configured for React routes.

---

## 8) Verification checklist (must pass before going live)

Run:

```bash
npm test
npm run build
```

Then manually verify:
- User registration and login work
- Service application creates a tracking code after form + document + dummy payment
- Tracking page finds that code
- Dashboard shows user’s own applications
- Admin account can open `/admin` and manage services + update status

---

## 9) Current architecture

- **Frontend**: React + TypeScript + Vite + Tailwind
- **Backend**: Supabase Auth + Postgres (`service_applications` table)
- **Production hosting**: Netlify

When Supabase env vars are missing, the app still opens in demo mode using local browser storage.

---

## 10) Common issues

### “Service not available” on login/register
Your `.env` file is missing or incorrect. Recheck Supabase URL and anon key.

### Applications are not saving in backend
Run `supabase/schema.sql` in Supabase SQL Editor and ensure the table/policies exist.

### Admin page redirects to dashboard
Add your email to `VITE_ADMIN_EMAILS`, restart app, and login again.

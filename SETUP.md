# ALPHA CREATIVE portals — setup guide

## What is now in the repository
- `/admin/`: founder sign-in and admin dashboard shell.
- `/client/`: client sign-in and client workspace shell.
- `portal.js`: Supabase authentication and role-gated data loading.
- `supabase/schema.sql`: database tables and row-level security policies.
- `supabase-config.js`: browser-safe project URL and publishable/anon key placeholders.

## Important: login cannot work until the backend is connected
GitHub Pages only hosts the website. It does not create accounts or securely store client data. A separate Supabase project for ALPHA CREATIVE is required. Do not reuse credentials from another project.

1. Create a Supabase project for ALPHA CREATIVE.
2. In its SQL Editor, run `supabase/schema.sql`.
3. In Project Settings → API, copy the Project URL and the publishable key (or legacy anon key). Put them in `supabase-config.js`.
4. In Authentication → Users, invite/create Manan and Abhinav with their own email addresses and strong passwords. Do not put passwords in GitHub or share them with the developer.
5. In SQL Editor, use each invited user's Auth UID to create the two admin profiles:
   `insert into public.profiles (id, full_name, role) values ('AUTH-UID-FOR-MANAN','Manan Singh','admin'), ('AUTH-UID-FOR-ABHINAV','Abhinav','admin');`
   Replace both placeholder UID strings with the real Auth user UUIDs before running.
6. Create client rows, then create each client's profile using that Auth UID and matching client_id. Never grant a client the admin role.
7. Enable email confirmation / password recovery in Supabase Auth. Add your GitHub Pages URL to Authentication → URL Configuration → Site URL and Redirect URLs.

## Security notes
- Only the publishable/anon key belongs in the browser. NEVER use a Supabase service_role key in GitHub Pages, HTML, JavaScript, or chat.
- Keep RLS enabled. The schema restricts client project/document reads to the matching client workspace; only admins can manage agency records.
- The SQL creates the initial core portal data model. Storage bucket policies, file upload UI, invoices/payments, and full CRM editing are not included yet.
- The admin page is role-gated, not hidden by an untrusted front-end flag. Supabase RLS enforces database access.

# ALPHA CREATIVE — founder portal setup

## Current project
- Public website: https://manansingh17082005-bot.github.io/manan-agency-website/
- Founder portal: https://manansingh17082005-bot.github.io/manan-agency-website/admin/
- Supabase project: **Alpha Creative Agency** (`opglxlyiekwcesxbxhbn`)
- Project URL and browser-safe publishable key are configured in `supabase-config.js`.
- The founder portal is restricted to the authorised owner email **dhruv170825@gmail.com** and checks the signed-in user's Supabase `app_metadata.role = owner`. Database RLS policies enforce the same owner role.

## First-time owner account
1. Open the Founder portal URL above.
2. Enter the authorised owner email and choose a strong password (at least 8 characters).
3. Click **FIRST-TIME OWNER ACCOUNT SETUP**.
4. Check that email inbox and confirm the email address if Supabase asks for verification.
5. Return to the portal and sign in. The deployed `alpha-owner-bootstrap` Edge Function verifies the signed-in user's email and then assigns the owner role using the server-side Supabase Admin API.
6. The function is JWT-protected. The service-role key stays inside the Supabase Edge Function environment and is never placed in the website.

If sign-up is disabled in Supabase Auth, enable email sign-ups temporarily in Authentication settings. In Authentication → URL Configuration, add `https://manansingh17082005-bot.github.io/manan-agency-website/admin/` to the allowed Redirect URLs. If email confirmation is enabled, complete that step before signing in. Do not create any additional owner accounts.

## Admin portal modules
- Overview metrics and recent enquiries.
- Leads & enquiries: add leads and update lead status.
- Clients: client directory derived from project agreements.
- Projects & contracts: create agreements and update contract status.
- Services & pricing: add/edit services, starting prices and negotiable pricing notes; hide or activate services.
- Portfolio videos: upload video/image files (max 100 MB) or add media URLs; keep drafts or publish them.
- Client reviews: approve or reject submitted reviews.
- Payments: record payments and mark payment records received.

The public contact form now saves new enquiries to `agency_leads` and then opens WhatsApp as an additional contact option.

## Backend and security
- Additive migration: `supabase/migrations/20261117_alpha_agency_admin_portal.sql`. It has been applied to the Alpha Creative Agency Supabase project.
- Existing agreement, payment and review tables are retained. New `agency_leads`, `service_catalog`, and `portfolio_items` tables have RLS enabled.
- The `agency-portfolio` Storage bucket is public-read for published portfolio media; uploads/updates/deletes require an authenticated owner JWT.
- Only the publishable key is included in `supabase-config.js`. Never put a service-role/secret key in GitHub, HTML, JavaScript or chat.
- Security advisor check after the migration returned no lints.
- This is an early production integration: public agreement signing links/PDF generation and fully synchronized public service/portfolio sections still need their next implementation pass. Review the agreement wording and payment terms with your own legal/accounting adviser before using them as binding documents.

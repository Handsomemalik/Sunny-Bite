# SUNNYBITE — ADMIN PANEL SETUP GUIDE 🥑
### Complete, Beginner-Friendly Step-by-Step Instructions

This guide walks you through setting up your private Supabase database and connecting it to your SunnyBite website. **No coding knowledge is required.** Once set up, you can edit every dish, price, picture, paragraph, and opening hour directly from `/admin` on your computer or phone!

---

## Architecture Overview (Why This Is Secure)
1. **Static Host (Hostinger):** Your React website is fast, lightweight, and hosted on Hostinger.
2. **Backend (Supabase):** Supabase provides a free, cloud Postgres database, authentication, file storage, and server-side **Row Level Security (RLS)**.
3. **Ironclad Protection:** Public visitors can only view visible menu items and published content. Only authenticated administrators listed in the `admins` table can make edits. Contact forms and orders are **write-only for visitors** — random users can never see each other's messages or orders.
4. **Offline / Fallback Resilience:** If Supabase is ever slow or temporarily unreachable, SunnyBite seamlessly falls back to its built-in default content. The public site will never crash or show a blank screen.

---

## Step 1: Create Your Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **"Start your project"** (or Sign In).
2. Click **"New Project"**.
3. Fill in the details:
   - **Name:** `SunnyBite` (or any name you prefer)
   - **Database Password:** Enter a strong password and save it in a safe place.
   - **Region:** Choose a region close to your customers (e.g., `Singapore (ap-southeast-1)` or `Frankfurt (eu-central-1)`).
   - **Pricing Plan:** Select **Free ($0/month)**.
4. Click **"Create new project"** and wait ~1-2 minutes for Supabase to finish provisioning your database.

---

## Step 2: Run the Database Schema

1. In the left-hand navigation bar of your Supabase dashboard, click the **SQL Editor** icon (it looks like a terminal `>_` or two query tabs).
2. Click **"New query"** (or **"+ New"** button at the top).
3. Open the file `supabase/schema.sql` from your SunnyBite project folder on your computer.
4. Copy the entire contents of `supabase/schema.sql` and paste them into the Supabase SQL editor.
5. Click the green **"Run"** button (or press `Ctrl + Enter` / `Cmd + Enter`).
6. You will see a green **"Success. No rows returned"** message at the bottom.
   > **What this did:** Created all 13 database tables (`admins`, `site_settings`, `categories`, `menu_items`, `page_content`, `chatbot_faq`, `media`, `messages`, `reservations`, `subscribers`, `orders`, `audit_log`, `content_versions`), installed Row Level Security (RLS) rules, and initialized the `site-media` file storage bucket.

---

## Step 3: Run the Seed Data (Populate All Existing Content)

1. In the Supabase **SQL Editor**, click **"New query"**.
2. Open the file `supabase/seed.sql` from your project folder.
3. Copy the entire contents of `supabase/seed.sql` and paste them into the editor.
4. Click the green **"Run"** button.
5. You will see a green **"Success"** message.
   > **What this did:** Pre-loaded all 18 SunnyBite dishes (with prices, descriptions, images, tags, dietary labels, and Roman Urdu aliases), 9 categories, complete homepage/about/menu/contact copy, operational hours, stats, announcement banner, and FAQ questions.

---

## Step 4: Create Your Admin Account

Supabase manages user accounts securely with encrypted passwords.

1. In the left-hand navigation bar of your Supabase dashboard, click **Authentication** (the user icon with a key).
2. Make sure you are on the **Users** tab, then click the green **"Add user"** button at top right -> select **"Create user"**.
3. In the modal:
   - **User Email:** Enter your email address (e.g., `admin@sunnybite.pk`).
   - **User Password:** Enter a secure password (at least 8 characters).
   - **Auto Confirm User?**: **Toggle this ON** (checked) so you can log in immediately without waiting for an email verification link.
4. Click **"Create user"**.
5. You will now see your new user in the list. Look at the column labeled **"User UID"** (a long string like `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).
6. Click the little copy icon next to your **User UID** to copy it to your clipboard.

---

## Step 5: Authorize Your Admin Account in `admins` Table

Because SunnyBite enforces strict Row Level Security, having an account is not enough — your UID must be listed in the `admins` table.

1. Go back to the **SQL Editor** in Supabase and click **"New query"**.
2. Paste the following SQL statement, replacing `<PASTE_YOUR_COPIED_UID_HERE>` with your actual User UID, and `<YOUR_EMAIL>` with your email:

```sql
INSERT INTO public.admins (user_id, email, role)
VALUES ('<PASTE_YOUR_COPIED_UID_HERE>', '<YOUR_EMAIL>', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```

*Example:*
```sql
INSERT INTO public.admins (user_id, email, role)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'admin@sunnybite.pk', 'owner')
ON CONFLICT (user_id) DO UPDATE SET role = 'owner';
```
3. Click the green **"Run"** button.
4. You are now officially the verified **Owner** of the SunnyBite Admin Panel!

---

## Step 6: Configure Environment Keys

1. In your Supabase dashboard, click the **Settings** gear icon at the bottom of the left sidebar.
2. Click **API** under the Configuration section.
3. You will see:
   - **Project URL:** Looks like `https://abcdefghijklm.supabase.co`
   - **Project API keys:** Look for the key labeled `anon` / `public` (starts with `eyJ...`).
   > ⚠️ **CRITICAL SECURITY RULE:** NEVER copy or use the `service_role` (secret) key in your frontend website or `.env`. ONLY use the `anon` key. Row Level Security ensures the `anon` key is 100% safe.
4. Open the `.env` file in the root of your `sunnybite` folder:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
5. Paste your Project URL and Anon Key, then save the file.

---

## Step 7: Test Locally Before Deploying

1. In your project terminal, make sure the dev server is running:
   ```bash
   npm run dev
   ```
2. Open your browser and visit:
   ```
   http://localhost:3000/admin
   ```
3. You will be greeted by the SunnyBite Admin login screen.
4. Enter your email (or keep `admin@sunnybite.pk`) and the Admin Password: `bb..99gg`.
5. You will instantly enter the **SunnyBite Admin Dashboard**!
6. Try changing a dish price or toggling a dish as "Sold Out" in **Menu Manager**, then view the live public site at `http://localhost:3000/menu` to verify it updates in real time.

---

## Step 8: Build and Deploy to Hostinger

When you are ready to update your live website on Hostinger:

1. **Build the production bundle:**
   ```bash
   npm run build
   ```
   This compiles your website into the `dist/` directory. All admin code is automatically code-split into separate lazy bundles so your public visitors experience blazing-fast load times.

2. **Upload to Hostinger File Manager:**
   - Log in to your **Hostinger hPanel**.
   - Navigate to **Websites** -> click **Manage** on `sunnybite.pk` (or your domain).
   - Click **File Manager** (Files -> File Manager).
   - Open the `public_html` folder.
   - Delete old static files if replacing an old build (or replace them).
   - Upload all files and folders from inside your local `dist/` folder into `public_html`.
   - **Ensure `.htaccess` is present:** The `dist/` folder includes a `.htaccess` file that handles React SPA routing, caching, and Gzip/Brotli compression. Ensure hidden files (`.*`) are visible in your file manager so `.htaccess` is uploaded.

3. **Visit your live admin panel:**
   ```
   https://sunnybite.pk/admin
   ```
   Log in with your admin credentials.

---

## Admin Modules Reference Table

| Module | URL | What It Controls |
| :--- | :--- | :--- |
| **Dashboard** | `/admin` | Live metrics counts (dishes, categories, new orders, reservations, messages, subscribers), recent audit activity feed, quick-action shortcuts. |
| **Menu Manager** | `/admin/menu` | Add, edit, duplicate, and delete dishes; upload dish photos; 1-tap "Sold Out" toggle; drag/reorder; bulk price adjustments (e.g. +10% or fixed Rs); bulk category reassignment; category manager. Live card preview matches public design. |
| **Page Editor** | `/admin/pages` | Visual editor for every section on Home, Menu, About, Contact, Footer, Privacy Policy, and Terms of Service. Edit every headline, paragraph, card, photo, and toggle section visibility. |
| **Media Library** | `/admin/media` | Upload photos (with drag-and-drop or mobile camera); automatic client-side WebP compression (max 1600px width); alt text management; 1-tap image URL copy. |
| **Site Settings** | `/admin/settings` | Restaurant brand name, phone, WhatsApp number, street address, Google Maps pin query, daily/weekend operating hours, public stats (4.9 rating, 12,000+ happy customers), ordering toggle (on/off, pickup/dine-in/delivery), announcement bar banner. |
| **Assistant Manager** | `/admin/assistant` | Bot welcome greeting, quick-reply chip suggestions, FAQ answers (delivery areas, payment methods, halal certification, parking, booking), dish aliases, plus an interactive test sandbox to chat with the bot before changes go live. |
| **Inbox** | `/admin/inbox` | Live inbox for Customer Orders, Table Reservations, Contact Form Inquiries, and Foodie Club Subscribers. Status badges (New, Seen, Confirmed, Done), 1-tap "Reply on WhatsApp", 1-tap "Call Customer", and 1-click CSV export of subscribers. |
| **SEO Manager** | `/admin/seo` | Search engine titles, meta descriptions, and OpenGraph social sharing images for all pages with a live Google search result snippet preview. |
| **Backup & History** | `/admin/backup` | 1-click full site JSON backup download; 1-click JSON restore with dry-run summary; version history rollback for any page section or setting; detailed audit activity log. |
| **Security & Accounts** | `/admin/security` | Change admin password; 2-Factor Authentication (TOTP) guidance; manage authorized admin emails/roles (`owner` or `editor`). |

---

## Free Tier Limits & Best Practices

SunnyBite is built to run smoothly on the **Supabase Free Plan ($0/month)**:

| Resource | Free Tier Allowance | SunnyBite Usage |
| :--- | :--- | :--- |
| **Database Space** | 500 MB Postgres Storage | SunnyBite uses ~5 MB for complete menu and text data (< 1% of limit). |
| **File Storage** | 1 GB Bucket Storage | Photos are compressed to WebP (~100-250 KB each), allowing **over 4,000 high-res photos**. |
| **Monthly Active Users** | 50,000 users | Only admins log in (~2-5 accounts). |
| **Egress Bandwidth** | 2 GB / month | Stale-while-revalidate caching ensures public visitors cache content locally. |
| **Database Pausing** | Pauses after 7 days of inactivity | If nobody visits the admin or public site for 7 days, Supabase pauses. Logging into Supabase dashboard or visiting unpauses it in seconds. |

### Recommended Maintenance:
1. **Regular Backups:** Once a month, visit `/admin/backup` and click **"Export Complete Site Backup (JSON)"**. Save the JSON file on your computer or Google Drive.
2. **Media Optimization:** When uploading pictures, use the built-in uploader in the admin panel — it automatically resizes and compresses them to modern WebP format for top speed.
3. **Adding Staff:** If you want a chef or manager to edit menu prices without having access to delete admin accounts, add them in `/admin/security` with the **`editor`** role. Only you (the **`owner`**) can manage other admin accounts.

---

### Need Help?
- **Public Site:** `https://sunnybite.pk/`
- **Admin Login:** `https://sunnybite.pk/admin/login`
- **Admin Dashboard:** `https://sunnybite.pk/admin/`

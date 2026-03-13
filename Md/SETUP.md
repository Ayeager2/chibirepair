# SETUP.md — Repair App (React + Supabase)

This project is a responsive web app for managing:

* Inventory
* Purchases
* Invoices / Sales
* Receipts (print-to-PDF)

## Tech Stack

* React (Vite)
* Supabase (Postgres + Auth + Storage later)

---

# 1) Prerequisites

Install:

* Node.js (LTS recommended)
* Git

Verify installation:

```bash
node -v
npm -v
git --version
```

---

# 2) Clone + Install

```bash
git clone <YOUR_GITHUB_REPO_URL>
cd repair-app
npm install
```

---

# 3) Create `.env.local` (Required)

Create a file named **`.env.local`** in the project root (same level as `package.json`).

Correct location:

```
repair-app/
  .env.local
  package.json
  src/
```

Add the following values **(NO quotes)**:

```env
VITE_SUPABASE_URL='url'
VITE_SUPABASE_ANON_KEY= 'key sb_'
```

⚠ Important:

* **Do NOT commit `.env.local` to GitHub**
* Ensure the file name is exactly `.env.local` (Windows sometimes hides extensions)

---

# 4) Run the App

```bash
npm run dev
```

Open the local URL Vite prints (usually):

```
http://localhost:5173
```

---

# 5) Supabase Setup Notes (One-Time)

Inside the **Supabase dashboard**:

1. Create your **Auth user (email/password)**
2. Ensure **Row Level Security (RLS)** is enabled
3. Ensure **policies are applied**
4. Ensure every table includes **`owner_id`**

If the app can:

* Login
* Add a product
* Refresh and still see the product

Then the Supabase connection is working correctly.

---

# 6) Supabase Types (Optional for New Machines)

### Do you need to regenerate types?

Usually **NO** — `src/types/supabase.ts` should already exist in the repo.

Only regenerate if the **database schema changes**.

---

### Regenerate Types (If Needed)

Install dependencies:

```bash
npm install
```

Login to Supabase:

```bash
npx supabase login
```

Link the project:

```bash
npx supabase link --project-ref nhuzhdrbhaxtvjpqmhrz
```

Generate types:

```bash
npm run gen:types
```

Commit updated types:

```bash
git add src/types/supabase.ts
git commit -m "Update Supabase types"
git push
```

---

# 7) Build for Production

```bash
npm run build
```

Output will be created in:

```
dist/
```

---

# 8) Deploy (Hostinger Basic Static Hosting)

Hostinger basic plans typically support **static hosting only**.

### Deployment Steps

Build the project:

```bash
npm run build
```

Upload the contents of the `dist/` folder to your Hostinger public directory:

```
public_html/
```

---

## SPA Routing Note

If using **React Router**, your host must redirect all routes to:

```
index.html
```

If Hostinger cannot do rewrites on your plan, you can:

* Use **hash routing** (`/#/inventory`)
* Or keep navigation minimal until deployment is configured

We can adjust this later when you deploy.

---

# 9) Common Troubleshooting

### Error: `supabaseUrl is required`

Possible causes:

* `.env.local` missing
* `.env.local` placed in wrong directory
* Quotes around environment variables

Restart the dev server after changes:

```bash
Ctrl + C
npm run dev
```

---

### Error: `"doesn't provide an export named 'supabase'"`

Ensure `src/supabaseClient.js` exports:

```javascript
export const supabase = createClient(...)
```

---

### RLS Errors (Permission Denied)

Possible causes:

* `owner_id: user.id` missing in inserts
* RLS not enabled
* Policies not applied correctly

---

# 10) Recommended `.gitignore`

Ensure `.env.local` is ignored:

```
.env.local
```

---

# Next Feature to Build

Next development milestone:

### Purchases System

Tables involved:

* `purchases`
* `purchase_items`
* `products`

Flow:

1. Create purchase
2. Add purchase items
3. Increase `products.qty_on_hand`

This will be the first **multi-table business transaction** in the system.

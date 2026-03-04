# SUPABASE_SETUP.md
## React + Supabase Setup (Auth + CRUD) for Repair App

This guide sets up:
- Supabase project connection
- Email/password login
- Protected routes
- Inventory (Products) CRUD example
- Proper Row Level Security (RLS) so only *you* can access your data

---

# 0) Create Supabase Project

1. Create a Supabase project
2. Go to **Project Settings → API**
3. Copy:
   - Project URL
   - anon public key

---

# 1) IMPORTANT: Add `owner_id` to tables (security)

Right now your tables don’t have a user owner column.
That means if you ever add another user (or if RLS isn’t correct), isolation is harder.

Even for a single-user app, do this *now* so the app is “correct.”

## Run this in Supabase SQL Editor

```sql
-- Add owner_id to core tables
alter table products       add column if not exists owner_id uuid;
alter table vendors        add column if not exists owner_id uuid;
alter table customers      add column if not exists owner_id uuid;
alter table purchases      add column if not exists owner_id uuid;
alter table purchase_items add column if not exists owner_id uuid;
alter table invoices       add column if not exists owner_id uuid;
alter table invoice_items  add column if not exists owner_id uuid;
alter table payments       add column if not exists owner_id uuid;
alter table settings       add column if not exists owner_id uuid;

-- Optional: create indexes for performance
create index if not exists idx_products_owner_id on products(owner_id);
create index if not exists idx_invoices_owner_id on invoices(owner_id);
create index if not exists idx_purchases_owner_id on purchases(owner_id);
Repair Business Management App – Development TODO
Project Goal

Build a cloud-hosted repair business management system accessible anywhere through Chrome on Windows and Android devices.

Core functionality:

Inventory tracking

Purchase tracking

Sales / invoices

Receipt generation

Inventory quantity automation

Basic business reporting

No mobile app installation required.

Phase 1 — Infrastructure Setup
✅ 1. Create Supabase Project

Completed

Supabase account created

Project created

Saved credentials

Saved keys:

Project URL

anon public key

service role key (secure)

✅ 2. Setup Database Schema

Core tables created.

Products

Tracks inventory items.

Fields:

id

owner_id

description

sku

cost

price

qty_on_hand

created_at

category_id

subcategory_id

device_model_id

variant_id

condition_id

status_id

source_id

Lookup Tables (Catalog System)

Normalized product catalog implemented.

Tables:

product_categories

product_subcategories

device_models

device_model_variants

product_conditions

product_statuses

sources

Relationships:

Category
   ↓
Subcategory
   ↓
Device Model
   ↓
Variant

Example:

Category: iPod
Subcategory: Classic
Model: 5th Gen
Variant: 30GB
Supporting Tables

Created:

vendors

customers

purchases

purchase_items

invoices

invoice_items

payments

settings

✅ 3. Row Level Security (RLS)

Implemented RLS policies.

Security model:

owner_id = auth.uid()

Users can only access their own data.

Policies added for:

products

customers

lookup tables

remaining tables secured

✅ 4. Inventory View

Created database view:

inventory_view

Provides joined data for UI:

category_name

subcategory_name

model_name

variant_name

condition_name

status_name

source_name

Used for simplified inventory queries.

Phase 2 — React Application Setup
✅ 5. Initialize React Project

Completed

React project created

Supabase client configured

Environment variables configured

App connected to database

✅ 6. Authentication

Completed

Features:

Supabase authentication

login page

protected routes

session provider

logout support

Components implemented:

AuthProvider

useAuth hook

RequireAuth route wrapper

✅ 7. Application Layout

Implemented

Features:

App layout wrapper

React Router structure

Offcanvas navigation menu

Page routing

Pages created:

Inventory

Catalog Manager

Login

Dashboard (basic)

Phase 3 — Inventory System

Inventory must exist before purchases or sales.

✅ 8. Inventory Page

Features implemented:

list products

add product

delete product

cascading dropdowns

Dropdown flow:

Category
 → Subcategory
 → Model
 → Variant

Additional dropdowns:

condition

status

source

✅ 9. Catalog Manager

Features:

Manage lookup tables:

categories

subcategories

models

variants

conditions

statuses

sources

Supports adding new catalog entries.

🔜 Next Work — Inventory Improvements

Planned:

edit product

inventory search

better dropdown UX (typeahead)

inline editing

bulk import (future)

Phase 4 — Purchase System (NEXT)

Purchases increase inventory.

⬜ 10. Vendor Management

Pages:

/vendors

Features:

add vendor

edit vendor

vendor list

vendor contact details

Fields:

name

phone

email

notes

⬜ 11. Purchase Entry

Pages:

/purchases/new

Features:

select vendor

purchase date

notes

add purchase items

Line item fields:

product

quantity

unit cost

⬜ 12. Automatic Inventory Increase

Database trigger planned:

qty_on_hand += purchased quantity

Implemented in Postgres, not React.

Prevents race conditions.

⬜ 13. Purchase History

Features:

list purchases

view purchase details

purchase totals

Phase 5 — Sales / Invoice System

Sales decrease inventory.

⬜ 14. Customer Management

Features:

create customer

edit customer

customer list

Fields:

name

phone

email

notes

⬜ 15. Invoice Creation

Features:

add labor lines

add parts from inventory

select customer

calculate subtotal

tax support

Inventory logic:

qty_on_hand -= sold quantity
⬜ 16. Invoice History

Features:

view invoices

view invoice details

payment status

Phase 6 — Receipt System
⬜ 17. Receipt Page

Features:

printable invoice

business header

invoice line items

totals

User action:

Print → Save as PDF
Phase 7 — Business Dashboard
⬜ 18. Dashboard

Display:

total sales

total expenses

estimated profit

recent activity

Phase 8 — System Settings
⬜ 19. Business Settings

Fields:

business name

phone

email

tax enabled

default tax rate

Phase 9 — Reports
⬜ 20. Reports

Reports planned:

sales report

expense report

profit report

inventory valuation

Future Improvements

Barcode scanning

Inventory alerts

PDF receipt automation

Email receipts

Expense categorization

Tax reporting export

Mobile UI improvements

Repair ticket workflow

Backup Strategy

Periodic database export

CSV export of key tables

optional automated backup job

Development Philosophy

Build in this order:

1. Database
2. Inventory
3. Purchases
4. Sales
5. Receipts
6. Dashboard

Each layer depends on the previous.

If you want, next I can also show you one extremely useful addition to this TODO that nearly every repair shop system eventually needs:

A Repair Ticket system that connects:

Customer
Device
Repair Status
Parts Used
Labor
Invoice

It integrates perfectly with the inventory system you already built.
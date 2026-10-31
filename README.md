# ⚡ Brightloop — Subscription Management System

> A mobile-first subscription management and recurring billing OS built for **Brightloop Software**, strictly following the challenge requirements from Odoo and styled with the vibrant maker aesthetics of [TinkerHub.org](https://tinkerhub.org).

---

## 🎨 TinkerHub Design Aesthetics
- **Neo-Brutalist Maker Styling**: Distinctive 2px solid dark borders (`border-2 border-zinc-900`), elevated neo-brutal drop shadows (`shadow-[3px_3px_0px_#121316]`), and responsive tactile button presses.
- **TinkerHub Color Tokens**:
  - 🟡 **Tinker Yellow** (`#F4C761`): Primary brand hero and interactive accents.
  - 🟢 **Maker Lime** (`#C3FF16`): Accent badges and sticker highlights.
  - 🟣 **Electric Purple** (`#5E1DB0` / `#884BD4`): Status tags, SLA chips, and operations indicators.
  - 🌿 **Mint Green** (`#3CD377`): Positive revenue indicators and active states.
  - 🔵 **Electric Blue** (`#479CFF`): Pipeline quotas and draft states.
  - 🏛️ **Canvas Warm Sand** (`#F8F7F4`): Tinker maker canvas background with subtle dot matrix texture.
- **Mobile-First UX**:
  - Sticky header with 1-click role persona switcher (`Admin`, `Staff`, `Customer`).
  - Mobile bottom navigation bar with live badge counts (quotes and overdue invoices).
  - Built-in simulator toggle to switch between a realistic mobile device shell and responsive desktop view.
  - Touch-friendly tap targets, modal bottom sheets, and printable invoice sheets.

---

## 🚀 Key Functional Capabilities

### 1. Unified Authentication & 3 Role Portals
- **Strict Password Rules**: Enforces `> 8 characters`, at least 1 uppercase letter, 1 lowercase letter, and 1 special character.
- **Single Account per Email**: Validated with unique database constraints.
- **Password Reset Simulation**: Interactive token generator and verification interface in the Admin Hub.
- **Role-Based Access**:
  - **Admin**: Full system control — manage products, Odoo variants, billing plans, tax rules, discount rules, and internal staff onboarding.
  - **Internal Staff**: Daily quote-to-subscription pipeline, automated billing runs, invoice management, and payment reconciliation.
  - **Customer Portal**: Isolated self-service view where customers see only their own subscriptions and invoices, pay balances, and pause/resume/renew eligible plans.

### 2. Products, Odoo Brand Variants & Plans
- **Catalog Management**: Software, Service, and Add-on items with sales and cost pricing.
- **Odoo Brand Variant**: Pre-configured and fully editable variant that adds **+$560** to the base price as specified in the problem statement.
- **Plan Policies**: Daily, Weekly, Monthly, and Yearly intervals with configurable policies:
  - Auto-close on expiry date
  - Early closure permissions
  - Pausing and resuming
  - Contract renewal permissions

### 3. Quotation Templates to Active Subscriptions
- Pre-packaged quotation templates (e.g., *High Growth SaaS Package*, *Starter Launch Bundle*).
- Interactive line item builder with live calculation of subtotals, variant adjustments, tiered taxes, and applied discount rules.
- Complete state lifecycle: `Draft` &rarr; `Quotation` &rarr; `Confirmed` &rarr; `Active` &rarr; `Closed`.

### 4. Automated "Billing Day" Engine
- **One-Click Batch Invoicing**: Scans all active and confirmed subscriptions eligible for billing.
- **Idempotent Billing**: Tracks `next_billing_date` and `last_invoiced_date` to ensure no subscription is billed twice or skipped.
- **Automatic Taxes & Discounts**: Calculates line-level taxes and applies active discount coupons automatically.
- **Invoice Lifecycle**: `Draft` &rarr; `Confirmed` &rarr; `Paid` (with Cancel, Send Email Notice, and Print/Save PDF capabilities).

### 5. Multi-Method Payment Recording
- Record customer payments via **Credit Card / Stripe**, **Bank Wire Transfer**, **UPI**, or **Cash**.
- Live invoice balance tracking: Automatically transitions invoices to `PAID` once the full balance is satisfied.
- Dynamic overdue receivables radar for immediate chasing.

### 6. Finance Lead Real-Time Analytics (<2s SLA)
- Instant sub-second calculation (<15ms via local SQLite WAL mode):
  - **MRR** (Monthly Recurring Revenue) & **ARR** (Annual Recurring Revenue)
  - **Total Revenue Collected**
  - **Overdue Invoices Radar**
  - **Pipeline Conversion Breakdown**

---

## 🛠️ Architecture & Local-First Tech Stack
- **Database**: Native SQLite (`node:sqlite` DatabaseSync) with WAL journal mode for zero-setup, lightning-fast local persistence.
- **Backend**: Express REST API running on `http://localhost:5000` with JWT token verification and role middleware.
- **Frontend**: React 18 + Vite + Tailwind CSS + Lucide Icons, served directly by the Express server.
- **Git Version Control**: Multi-commit history following conventional commits.

---

## 🏃 Running the Application

### 1. Start the Unified Server (Backend API + Mobile Frontend)
```bash
node server/index.js
```
Open **`http://localhost:5000`** in any mobile or desktop browser!

### 2. Demo Credentials Pre-Loaded
| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@brightloop.com` | `Admin@1234` |
| **Internal Staff** | `staff@brightloop.com` | `Staff@1234` |
| **Customer** | `elena@novatech.co` | `Cust@1234` |
| **Customer (TinkerLabs)** | `priya@tinkerlabs.org` | `Cust@1234` |

*(You can also switch personas in 1 click using the top right account dropdown!)*

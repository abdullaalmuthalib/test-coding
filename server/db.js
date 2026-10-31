import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// On Vercel, the root filesystem is read-only; use /tmp for SQLite writes
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'brightloop.db')
  : path.join(__dirname, 'brightloop.db');

export const db = new DatabaseSync(DB_PATH);

// Enable WAL for high concurrency & speed
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {
  // In some environments journal_mode = WAL may default to delete
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'staff', 'customer')) NOT NULL DEFAULT 'customer',
      company_name TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'software', 'service', 'addon'
      sales_price REAL NOT NULL,
      cost_price REAL NOT NULL,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      variant_name TEXT NOT NULL,
      price_adjustment REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cost REAL NOT NULL,
      billing_interval TEXT CHECK(billing_interval IN ('daily', 'weekly', 'monthly', 'yearly')) NOT NULL,
      min_quantity INTEGER DEFAULT 1,
      start_date TEXT,
      end_date TEXT,
      auto_close INTEGER DEFAULT 0,
      allow_close_early INTEGER DEFAULT 1,
      allow_pause INTEGER DEFAULT 1,
      allow_renew INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tax_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rate REAL NOT NULL, -- e.g. 18 for 18%
      description TEXT,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS discount_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('fixed', 'percentage')) NOT NULL,
      value REAL NOT NULL,
      min_purchase_amount REAL DEFAULT 0,
      min_quantity INTEGER DEFAULT 1,
      target_type TEXT CHECK(target_type IN ('subscription', 'product')) NOT NULL DEFAULT 'subscription',
      target_product_id INTEGER,
      start_date TEXT,
      end_date TEXT,
      usage_limit INTEGER DEFAULT 100,
      times_used INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (target_product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quotation_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      plan_id INTEGER,
      validity_days INTEGER DEFAULT 15,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS quotation_template_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 18,
      FOREIGN KEY (template_id) REFERENCES quotation_templates(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      expiry_date TEXT,
      payment_terms TEXT NOT NULL DEFAULT 'Net 15',
      status TEXT CHECK(status IN ('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed')) NOT NULL DEFAULT 'draft',
      last_invoiced_date TEXT,
      next_billing_date TEXT,
      applied_discount_id INTEGER,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT,
      FOREIGN KEY (applied_discount_id) REFERENCES discount_rules(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS subscription_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      variant_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 18,
      discount_rate REAL DEFAULT 0,
      amount REAL NOT NULL,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      subscription_id INTEGER,
      customer_id INTEGER NOT NULL,
      issue_date TEXT NOT NULL,
      due_date TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      tax_total REAL NOT NULL DEFAULT 0,
      discount_total REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      status TEXT CHECK(status IN ('draft', 'confirmed', 'paid', 'cancelled')) NOT NULL DEFAULT 'draft',
      billing_period_start TEXT,
      billing_period_end TEXT,
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      variant_name TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 18,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      line_total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      payment_number TEXT UNIQUE NOT NULL,
      method TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      note TEXT,
      recorded_by_user_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE RESTRICT,
      FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_subs_status_date ON subscriptions(status, next_billing_date);
    CREATE INDEX IF NOT EXISTS idx_subs_customer ON subscriptions(customer_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_sub_period ON invoices(subscription_id, billing_period_start);
    CREATE INDEX IF NOT EXISTS idx_invoices_status_due ON invoices(status, due_date);
    CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
  `);

  seedDatabase();
}

function seedDatabase() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const salt = bcrypt.genSaltSync(10);
  const adminPass = bcrypt.hashSync('Admin@1234', salt);
  const staffPass = bcrypt.hashSync('Staff@1234', salt);
  const custPass = bcrypt.hashSync('Cust@1234', salt);

  // Users
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, company_name)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('Brightloop Admin', 'admin@brightloop.com', adminPass, 'admin', 'Brightloop HQ');
  insertUser.run('Sarah Sales Lead', 'staff@brightloop.com', staffPass, 'staff', 'Brightloop Operations');
  insertUser.run('Elena Gilbert', 'elena@novatech.co', custPass, 'customer', 'NovaTech Solutions');
  insertUser.run('Marcus Chen', 'marcus@hypergrowth.io', custPass, 'customer', 'HyperGrowth Media');
  insertUser.run('Priya Sharma', 'priya@tinkerlabs.org', custPass, 'customer', 'TinkerLabs Studio');

  // Taxes
  const insertTax = db.prepare('INSERT INTO tax_rules (name, rate, description, is_default) VALUES (?, ?, ?, ?)');
  insertTax.run('Standard GST/VAT', 18.0, 'Standard goods and services tax on SaaS', 1);
  insertTax.run('Reduced IT Services Tax', 10.0, 'Applicable to small enterprise consulting', 0);
  insertTax.run('Zero-Rated Export', 0.0, 'International client export billing', 0);

  // Products
  const insertProduct = db.prepare(`
    INSERT INTO products (name, type, sales_price, cost_price, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const p1 = insertProduct.run('Brightloop Core ERP', 'software', 1200.0, 350.0, 'Unified core subscription ERP engine').lastInsertRowid;
  const p2 = insertProduct.run('Dedicated Cloud Pod', 'service', 250.0, 80.0, 'High-performance isolated cloud instance').lastInsertRowid;
  const p3 = insertProduct.run('Automated Billing AI', 'addon', 150.0, 30.0, 'Auto-reconciliation & smart chasing agent').lastInsertRowid;
  const p4 = insertProduct.run('24/7 Priority SLA Support', 'service', 450.0, 120.0, 'Guaranteed 15min response time & phone support').lastInsertRowid;

  // Variants (Explicitly addressing Odoo Brand adds 560 from the prompt)
  const insertVariant = db.prepare('INSERT INTO product_variants (product_id, variant_name, price_adjustment) VALUES (?, ?, ?)');
  const v1 = insertVariant.run(p1, 'Standard Community Edition', 0).lastInsertRowid;
  const v2 = insertVariant.run(p1, 'Odoo Brand Edition', 560.0).lastInsertRowid;
  const v3 = insertVariant.run(p1, 'Enterprise Multi-Branch', 1200.0).lastInsertRowid;

  insertVariant.run(p2, 'Standard 4-Core / 16GB', 0);
  insertVariant.run(p2, 'High-Compute 16-Core / 64GB', 350.0);

  // Plans
  const insertPlan = db.prepare(`
    INSERT INTO plans (name, cost, billing_interval, min_quantity, start_date, end_date, auto_close, allow_close_early, allow_pause, allow_renew)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const planMonthly = insertPlan.run('Brightloop Monthly Business', 299.0, 'monthly', 1, '2026-01-01', '2028-12-31', 0, 1, 1, 1).lastInsertRowid;
  const planAnnual = insertPlan.run('Brightloop Annual Enterprise', 2900.0, 'yearly', 2, '2026-01-01', '2029-12-31', 1, 0, 1, 1).lastInsertRowid;
  const planWeekly = insertPlan.run('Rapid Sprint Pass', 99.0, 'weekly', 1, '2026-01-01', '2027-12-31', 1, 1, 0, 1).lastInsertRowid;
  const planDaily = insertPlan.run('Burst Compute Daily', 35.0, 'daily', 1, '2026-01-01', '2027-12-31', 1, 1, 0, 0).lastInsertRowid;

  // Discount Rules
  const insertDiscount = db.prepare(`
    INSERT INTO discount_rules (code, name, type, value, min_purchase_amount, min_quantity, target_type, target_product_id, start_date, end_date, usage_limit, times_used, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const d1 = insertDiscount.run('TINKER20', 'TinkerHub Maker Promo 20%', 'percentage', 20.0, 500.0, 1, 'subscription', null, '2026-01-01', '2027-12-31', 100, 12, 1).lastInsertRowid;
  const d2 = insertDiscount.run('ODOOBOOST', 'Odoo Migration Rebate', 'fixed', 200.0, 1000.0, 1, 'product', p1, '2026-01-01', '2027-12-31', 50, 8, 1).lastInsertRowid;
  const d3 = insertDiscount.run('FLAT150', 'Quarterly Flat Rebate', 'fixed', 150.0, 800.0, 1, 'subscription', null, '2026-01-01', '2027-06-30', 30, 4, 1).lastInsertRowid;

  // Quotation Templates
  const insertTemplate = db.prepare('INSERT INTO quotation_templates (name, plan_id, validity_days, notes) VALUES (?, ?, ?, ?)');
  const t1 = insertTemplate.run('High Growth SaaS Package', planAnnual, 30, 'Includes Odoo edition core ERP and cloud pod').lastInsertRowid;
  const t2 = insertTemplate.run('Starter Launch Bundle', planMonthly, 15, 'Base ERP with standard community edition').lastInsertRowid;

  const insertTemplateLine = db.prepare(`
    INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, tax_rate)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertTemplateLine.run(t1, p1, v2, 2, 1760.0, 18.0);
  insertTemplateLine.run(t1, p2, 4, 1, 250.0, 18.0);
  insertTemplateLine.run(t2, p1, v1, 1, 1200.0, 18.0);

  // Subscriptions
  const insertSub = db.prepare(`
    INSERT INTO subscriptions (subscription_number, customer_id, plan_id, start_date, expiry_date, payment_terms, status, last_invoiced_date, next_billing_date, applied_discount_id, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const s1 = insertSub.run('SUB-2026-001', 3, planMonthly, '2026-10-01', '2027-09-30', 'Net 15', 'active', '2026-10-01', '2026-11-01', d1, 'Customer requested Odoo variant core system').lastInsertRowid;
  const s2 = insertSub.run('SUB-2026-002', 4, planAnnual, '2026-09-15', '2027-09-14', 'Net 30', 'active', '2026-09-15', '2027-09-15', null, 'Yearly enterprise contract').lastInsertRowid;
  const s3 = insertSub.run('SUB-2026-003', 5, planMonthly, '2026-10-15', '2027-10-14', 'Immediate', 'confirmed', null, '2026-10-31', d2, 'Confirmed quotation awaiting first billing day run').lastInsertRowid;
  const s4 = insertSub.run('SUB-2026-004', 3, planWeekly, '2026-10-20', '2026-11-20', 'Net 15', 'paused', '2026-10-20', '2026-10-27', null, 'Paused temporarily during platform migration').lastInsertRowid;
  const s5 = insertSub.run('SUB-2026-005', 4, planMonthly, '2026-10-28', '2027-10-27', 'Net 15', 'quotation', null, '2026-11-05', null, 'Sent quote valid for 15 days').lastInsertRowid;

  // Subscription Lines
  const insertSubLine = db.prepare(`
    INSERT INTO subscription_lines (subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, discount_rate, amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertSubLine.run(s1, p1, v2, 1, 1760.0, 18.0, 20.0, 1408.0);
  insertSubLine.run(s1, p3, null, 1, 150.0, 18.0, 0.0, 150.0);
  insertSubLine.run(s2, p1, v3, 2, 2400.0, 18.0, 0.0, 4800.0);
  insertSubLine.run(s2, p4, null, 1, 450.0, 18.0, 0.0, 450.0);
  insertSubLine.run(s3, p1, v2, 1, 1760.0, 18.0, 0.0, 1760.0);
  insertSubLine.run(s4, p2, null, 1, 250.0, 18.0, 0.0, 250.0);
  insertSubLine.run(s5, p1, v1, 1, 1200.0, 18.0, 0.0, 1200.0);

  // Invoices
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (invoice_number, subscription_id, customer_id, issue_date, due_date, subtotal, tax_total, discount_total, total_amount, paid_amount, status, billing_period_start, billing_period_end, sent_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const inv1 = insertInvoice.run('INV-2026-0001', s1, 3, '2026-10-01', '2026-10-16', 1910.0, 280.44, 352.0, 1838.44, 1838.44, 'paid', '2026-10-01', '2026-10-31', '2026-10-01 10:00:00').lastInsertRowid;
  const inv2 = insertInvoice.run('INV-2026-0002', s2, 4, '2026-09-15', '2026-10-15', 5250.0, 945.0, 0.0, 6195.0, 6195.0, 'paid', '2026-09-15', '2027-09-14', '2026-09-15 11:30:00').lastInsertRowid;
  const inv3 = insertInvoice.run('INV-2026-0003', s1, 3, '2026-10-25', '2026-11-09', 1910.0, 280.44, 352.0, 1838.44, 0.0, 'confirmed', '2026-11-01', '2026-11-30', '2026-10-25 09:00:00').lastInsertRowid;
  const inv4 = insertInvoice.run('INV-2026-0004', s4, 3, '2026-10-20', '2026-10-25', 250.0, 45.0, 0.0, 295.0, 0.0, 'confirmed', '2026-10-20', '2026-10-27', null).lastInsertRowid;

  // Invoice Lines
  const insertInvLine = db.prepare(`
    INSERT INTO invoice_lines (invoice_id, product_name, variant_name, quantity, unit_price, tax_rate, tax_amount, discount_amount, line_total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertInvLine.run(inv1, 'Brightloop Core ERP', 'Odoo Brand Edition', 1, 1760.0, 18.0, 253.44, 352.0, 1661.44);
  insertInvLine.run(inv1, 'Automated Billing AI', null, 1, 150.0, 18.0, 27.0, 0.0, 177.0);

  insertInvLine.run(inv2, 'Brightloop Core ERP', 'Enterprise Multi-Branch', 2, 2400.0, 18.0, 864.0, 0.0, 5664.0);
  insertInvLine.run(inv2, '24/7 Priority SLA Support', null, 1, 450.0, 18.0, 81.0, 0.0, 531.0);

  insertInvLine.run(inv3, 'Brightloop Core ERP', 'Odoo Brand Edition', 1, 1760.0, 18.0, 253.44, 352.0, 1661.44);
  insertInvLine.run(inv3, 'Automated Billing AI', null, 1, 150.0, 18.0, 27.0, 0.0, 177.0);

  insertInvLine.run(inv4, 'Dedicated Cloud Pod', 'Standard 4-Core / 16GB', 1, 250.0, 18.0, 45.0, 0.0, 295.0);

  // Payments
  const insertPayment = db.prepare(`
    INSERT INTO payments (invoice_id, payment_number, method, amount, payment_date, note, recorded_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertPayment.run(inv1, 'PAY-2026-0001', 'Credit Card', 1838.44, '2026-10-02', 'Paid via Stripe online portal', 3);
  insertPayment.run(inv2, 'PAY-2026-0002', 'Bank Transfer', 6195.0, '2026-09-18', 'Wire transfer ref #WT-882910', 1);

  console.log('✅ SQLite database initialized with rich Brightloop seed data!');
}

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db, initDatabase } from './db.js';

initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'brightloop-super-secret-key-2026';

app.use(cors());
app.use(express.json());

// ==========================================
// AUTH MIDDLEWARE & HELPERS
// ==========================================
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires ${roles.join(' or ')} access` });
    }
    next();
  };
}

// Password validation rule per prompt:
// "more than eight characters, with an uppercase letter, a lowercase letter and a special character"
function validatePassword(password) {
  if (!password || password.length <= 8) {
    return 'Password must be more than 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null;
}

// ==========================================
// AUTH ROUTES
// ==========================================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, company_name } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const pwdError = validatePassword(password);
  if (pwdError) {
    return res.status(400).json({ error: pwdError });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(400).json({ error: 'This email is already registered to an account' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, company_name)
    VALUES (?, ?, ?, 'customer', ?)
  `).run(name.trim(), email.toLowerCase().trim(), hash, company_name || null);

  const newUser = {
    id: Number(result.lastInsertRowid),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: 'customer',
    company_name: company_name || null
  };

  const token = jwt.sign(newUser, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ user: newUser, token });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    company_name: user.company_name
  };

  const token = jwt.sign(userData, JWT_SECRET, { expiresIn: '7d' });
  res.json({ user: userData, token });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, company_name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// Password Reset Request
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.json({ message: 'If that email exists, a password reset link has been dispatched.' });
  }

  const token = 'rst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour

  db.prepare(`
    INSERT INTO password_resets (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).run(user.id, token, expiresAt);

  // In production, an email is sent. For local preview/testing, return simulated link info
  res.json({
    message: `Reset link sent to registered email ${user.email}`,
    resetToken: token,
    demoLink: `/reset-password?token=${token}`
  });
});

// Execute Password Reset
app.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  const pwdError = validatePassword(newPassword);
  if (pwdError) return res.status(400).json({ error: pwdError });

  const resetRecord = db.prepare(`
    SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now')
  `).get(token);

  if (!resetRecord) {
    return res.status(400).json({ error: 'Invalid or expired password reset link' });
  }

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, resetRecord.user_id);
  db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(resetRecord.id);

  res.json({ message: 'Password updated successfully! You can now log in.' });
});

// ==========================================
// USERS & STAFF MANAGEMENT
// ==========================================
app.get('/api/users', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, role, company_name, created_at
    FROM users
    ORDER BY id ASC
  `).all();
  res.json({ users });
});

// Only Admin can add a new member of staff (Prompt Rule)
app.post('/api/users/staff', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }

  const pwdError = validatePassword(password);
  if (pwdError) return res.status(400).json({ error: pwdError });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) return res.status(400).json({ error: 'Email already exists' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, company_name)
    VALUES (?, ?, ?, 'staff', 'Brightloop Operations')
  `).run(name.trim(), email.toLowerCase().trim(), hash);

  res.status(201).json({
    message: 'Staff member created successfully',
    user: { id: Number(result.lastInsertRowid), name, email, role: 'staff' }
  });
});

// ==========================================
// PRODUCTS & VARIANTS
// ==========================================
app.get('/api/products', authenticateToken, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY name ASC').all();
  const variants = db.prepare('SELECT * FROM product_variants ORDER BY id ASC').all();

  const productMap = products.map(p => ({
    ...p,
    variants: variants.filter(v => v.product_id === p.id)
  }));

  res.json({ products: productMap });
});

app.post('/api/products', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, type, sales_price, cost_price, notes, variants } = req.body;

  if (!name || !type || sales_price === undefined || cost_price === undefined) {
    return res.status(400).json({ error: 'Name, type, sales_price, and cost_price are required' });
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (name, type, sales_price, cost_price, notes)
    VALUES (?, ?, ?, ?, ?)
  `);

  const prodResult = insertProduct.run(name.trim(), type, parseFloat(sales_price), parseFloat(cost_price), notes || '');
  const productId = Number(prodResult.lastInsertRowid);

  if (Array.isArray(variants)) {
    const insertVariant = db.prepare(`
      INSERT INTO product_variants (product_id, variant_name, price_adjustment)
      VALUES (?, ?, ?)
    `);
    for (const v of variants) {
      if (v.variant_name && v.variant_name.trim()) {
        insertVariant.run(productId, v.variant_name.trim(), parseFloat(v.price_adjustment || 0));
      }
    }
  }

  res.status(201).json({ message: 'Product created successfully', id: productId });
});

// ==========================================
// PLANS
// ==========================================
app.get('/api/plans', authenticateToken, (req, res) => {
  const plans = db.prepare('SELECT * FROM plans ORDER BY id ASC').all();
  res.json({ plans });
});

app.post('/api/plans', authenticateToken, requireRole('admin'), (req, res) => {
  const {
    name, cost, billing_interval, min_quantity,
    start_date, end_date, auto_close, allow_close_early, allow_pause, allow_renew
  } = req.body;

  if (!name || cost === undefined || !billing_interval) {
    return res.status(400).json({ error: 'Name, cost, and billing_interval are required' });
  }

  const result = db.prepare(`
    INSERT INTO plans (name, cost, billing_interval, min_quantity, start_date, end_date, auto_close, allow_close_early, allow_pause, allow_renew)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    name.trim(),
    parseFloat(cost),
    billing_interval,
    parseInt(min_quantity || 1),
    start_date || null,
    end_date || null,
    auto_close ? 1 : 0,
    allow_close_early ? 1 : 0,
    allow_pause ? 1 : 0,
    allow_renew ? 1 : 0
  );

  res.status(201).json({ message: 'Plan created successfully', id: Number(result.lastInsertRowid) });
});

// ==========================================
// TAX RULES & DISCOUNTS
// ==========================================
app.get('/api/taxes', authenticateToken, (req, res) => {
  const taxes = db.prepare('SELECT * FROM tax_rules ORDER BY is_default DESC, name ASC').all();
  res.json({ taxes });
});

app.post('/api/taxes', authenticateToken, requireRole('admin'), (req, res) => {
  const { name, rate, description, is_default } = req.body;
  if (!name || rate === undefined) return res.status(400).json({ error: 'Name and rate are required' });

  if (is_default) {
    db.prepare('UPDATE tax_rules SET is_default = 0').run();
  }

  const result = db.prepare(`
    INSERT INTO tax_rules (name, rate, description, is_default)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), parseFloat(rate), description || '', is_default ? 1 : 0);

  res.status(201).json({ message: 'Tax rule created', id: Number(result.lastInsertRowid) });
});

app.get('/api/discounts', authenticateToken, (req, res) => {
  const discounts = db.prepare(`
    SELECT d.*, p.name as target_product_name
    FROM discount_rules d
    LEFT JOIN products p ON d.target_product_id = p.id
    ORDER BY d.id DESC
  `).all();
  res.json({ discounts });
});

// Only Admin can create discount rules (Prompt Rule)
app.post('/api/discounts', authenticateToken, requireRole('admin'), (req, res) => {
  const {
    code, name, type, value, min_purchase_amount,
    min_quantity, target_type, target_product_id, start_date, end_date, usage_limit
  } = req.body;

  if (!code || !name || !type || value === undefined) {
    return res.status(400).json({ error: 'Code, name, type, and value are required' });
  }

  const existing = db.prepare('SELECT id FROM discount_rules WHERE code = ?').get(code.toUpperCase().trim());
  if (existing) return res.status(400).json({ error: 'Discount code already exists' });

  const result = db.prepare(`
    INSERT INTO discount_rules (code, name, type, value, min_purchase_amount, min_quantity, target_type, target_product_id, start_date, end_date, usage_limit, times_used, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1)
  `).run(
    code.toUpperCase().trim(),
    name.trim(),
    type,
    parseFloat(value),
    parseFloat(min_purchase_amount || 0),
    parseInt(min_quantity || 1),
    target_type || 'subscription',
    target_product_id ? parseInt(target_product_id) : null,
    start_date || null,
    end_date || null,
    parseInt(usage_limit || 100)
  );

  res.status(201).json({ message: 'Discount rule created', id: Number(result.lastInsertRowid) });
});

// ==========================================
// QUOTATION TEMPLATES
// ==========================================
app.get('/api/templates', authenticateToken, (req, res) => {
  const templates = db.prepare(`
    SELECT t.*, p.name as plan_name, p.cost as plan_cost, p.billing_interval
    FROM quotation_templates t
    LEFT JOIN plans p ON t.plan_id = p.id
    ORDER BY t.id DESC
  `).all();

  const lines = db.prepare(`
    SELECT l.*, pr.name as product_name, pv.variant_name, pv.price_adjustment
    FROM quotation_template_lines l
    JOIN products pr ON l.product_id = pr.id
    LEFT JOIN product_variants pv ON l.variant_id = pv.id
  `).all();

  const fullTemplates = templates.map(t => ({
    ...t,
    lines: lines.filter(l => l.template_id === t.id)
  }));

  res.json({ templates: fullTemplates });
});

app.post('/api/templates', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const { name, plan_id, validity_days, notes, lines } = req.body;
  if (!name || !plan_id) return res.status(400).json({ error: 'Template name and plan are required' });

  const result = db.prepare(`
    INSERT INTO quotation_templates (name, plan_id, validity_days, notes)
    VALUES (?, ?, ?, ?)
  `).run(name.trim(), plan_id, parseInt(validity_days || 15), notes || '');

  const templateId = Number(result.lastInsertRowid);

  if (Array.isArray(lines)) {
    const insertLine = db.prepare(`
      INSERT INTO quotation_template_lines (template_id, product_id, variant_id, quantity, unit_price, tax_rate)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const l of lines) {
      insertLine.run(templateId, l.product_id, l.variant_id || null, l.quantity || 1, l.unit_price, l.tax_rate || 18);
    }
  }

  res.status(201).json({ message: 'Quotation template created', id: templateId });
});

// ==========================================
// SUBSCRIPTIONS
// ==========================================
app.get('/api/subscriptions', authenticateToken, (req, res) => {
  let query = `
    SELECT s.*, u.name as customer_name, u.email as customer_email, u.company_name,
           p.name as plan_name, p.billing_interval, p.cost as plan_cost,
           p.auto_close as plan_auto_close, p.allow_close_early, p.allow_pause, p.allow_renew,
           d.code as discount_code, d.name as discount_name, d.value as discount_value, d.type as discount_type
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    JOIN plans p ON s.plan_id = p.id
    LEFT JOIN discount_rules d ON s.applied_discount_id = d.id
  `;

  // Role filtering: Customers only see their own subscriptions!
  let subscriptions;
  if (req.user.role === 'customer') {
    query += ' WHERE s.customer_id = ? ORDER BY s.id DESC';
    subscriptions = db.prepare(query).all(req.user.id);
  } else {
    query += ' ORDER BY s.id DESC';
    subscriptions = db.prepare(query).all();
  }

  const allLines = db.prepare(`
    SELECT sl.*, p.name as product_name, pv.variant_name
    FROM subscription_lines sl
    JOIN products p ON sl.product_id = p.id
    LEFT JOIN product_variants pv ON sl.variant_id = pv.id
  `).all();

  const enriched = subscriptions.map(sub => ({
    ...sub,
    lines: allLines.filter(l => l.subscription_id === sub.id)
  }));

  res.json({ subscriptions: enriched });
});

app.get('/api/subscriptions/:id', authenticateToken, (req, res) => {
  const sub = db.prepare(`
    SELECT s.*, u.name as customer_name, u.email as customer_email, u.company_name,
           p.name as plan_name, p.billing_interval, p.cost as plan_cost,
           p.auto_close as plan_auto_close, p.allow_close_early, p.allow_pause, p.allow_renew,
           d.code as discount_code, d.name as discount_name, d.value as discount_value, d.type as discount_type
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    JOIN plans p ON s.plan_id = p.id
    LEFT JOIN discount_rules d ON s.applied_discount_id = d.id
    WHERE s.id = ?
  `).get(req.params.id);

  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this subscription' });
  }

  const lines = db.prepare(`
    SELECT sl.*, p.name as product_name, pv.variant_name
    FROM subscription_lines sl
    JOIN products p ON sl.product_id = p.id
    LEFT JOIN product_variants pv ON sl.variant_id = pv.id
    WHERE sl.subscription_id = ?
  `).all(sub.id);

  res.json({ subscription: { ...sub, lines } });
});

app.post('/api/subscriptions', authenticateToken, (req, res) => {
  // If customer is creating, enforce customer_id = req.user.id
  const customerId = req.user.role === 'customer' ? req.user.id : (req.body.customer_id || req.user.id);
  const { plan_id, start_date, expiry_date, payment_terms, status, applied_discount_id, notes, lines } = req.body;

  if (!plan_id || !start_date || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: 'Plan, start date, and at least one product line are required' });
  }

  // Generate unique Subscription Number: SUB-YYYY-XXXX
  const year = new Date().getFullYear();
  const count = db.prepare('SELECT count(*) as count FROM subscriptions').get().count + 1;
  const subNumber = `SUB-${year}-${String(count).padStart(3, '0')}`;

  const initialStatus = status || (req.user.role === 'customer' ? 'quotation' : 'draft');

  const result = db.prepare(`
    INSERT INTO subscriptions (
      subscription_number, customer_id, plan_id, start_date, expiry_date,
      payment_terms, status, last_invoiced_date, next_billing_date, applied_discount_id, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
  `).run(
    subNumber,
    customerId,
    plan_id,
    start_date,
    expiry_date || null,
    payment_terms || 'Net 15',
    initialStatus,
    start_date, // Next billing date initialised to start date
    applied_discount_id || null,
    notes || ''
  );

  const subId = Number(result.lastInsertRowid);

  const insertLine = db.prepare(`
    INSERT INTO subscription_lines (
      subscription_id, product_id, variant_id, quantity, unit_price, tax_rate, discount_rate, amount
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const line of lines) {
    const qty = parseInt(line.quantity || 1);
    const unitPrice = parseFloat(line.unit_price);
    const taxRate = parseFloat(line.tax_rate || 18);
    const discountRate = parseFloat(line.discount_rate || 0);
    const lineSubtotal = qty * unitPrice;
    const discounted = lineSubtotal * (1 - discountRate / 100);
    const lineAmount = discounted * (1 + taxRate / 100);

    insertLine.run(
      subId,
      line.product_id,
      line.variant_id || null,
      qty,
      unitPrice,
      taxRate,
      discountRate,
      lineAmount
    );
  }

  res.status(201).json({
    message: 'Subscription created successfully',
    id: subId,
    subscription_number: subNumber
  });
});

// Update Subscription Status (Workflow: Draft -> Quotation -> Confirmed -> Active -> Closed / Paused)
app.patch('/api/subscriptions/:id/status', authenticateToken, (req, res) => {
  const { status } = req.body;
  const subId = req.params.id;

  const sub = db.prepare(`
    SELECT s.*, p.allow_close_early, p.allow_pause, p.allow_renew
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.id = ?
  `).get(subId);

  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  // Permissions check
  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Plan rules enforcement
  if (status === 'paused' && !sub.allow_pause) {
    return res.status(400).json({ error: 'This plan does not permit pausing' });
  }
  if (status === 'closed' && !sub.allow_close_early && sub.status === 'active') {
    return res.status(400).json({ error: 'This plan does not permit early closure' });
  }

  const validTransitions = ['draft', 'quotation', 'confirmed', 'active', 'paused', 'closed'];
  if (!validTransitions.includes(status)) {
    return res.status(400).json({ error: 'Invalid subscription status' });
  }

  db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run(status, subId);
  res.json({ message: `Subscription status updated to ${status}`, status });
});

// Renew Subscription
app.post('/api/subscriptions/:id/renew', authenticateToken, (req, res) => {
  const subId = req.params.id;
  const sub = db.prepare(`
    SELECT s.*, p.allow_renew, p.billing_interval
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.id = ?
  `).get(subId);

  if (!sub) return res.status(404).json({ error: 'Subscription not found' });
  if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  if (!sub.allow_renew) {
    return res.status(400).json({ error: 'This plan does not permit renewals' });
  }

  // Extend expiry by 1 year or interval
  const currentExpiry = sub.expiry_date ? new Date(sub.expiry_date) : new Date();
  currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
  const newExpiry = currentExpiry.toISOString().split('T')[0];

  db.prepare('UPDATE subscriptions SET status = ?, expiry_date = ? WHERE id = ?').run('active', newExpiry, subId);
  res.json({ message: 'Subscription successfully renewed!', newExpiry, status: 'active' });
});

// ==========================================
// BILLING DAY AUTOMATION & INVOICES
// ==========================================
// "It is billing day, and hundreds of subscriptions are due at once.
// Nobody should be typing invoices by hand. Each one should be created from its subscription...
// Nothing should be billed twice or skipped."
app.post('/api/billing/run-billing-day', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Fetch all active or confirmed subscriptions eligible for billing
  const eligibleSubs = db.prepare(`
    SELECT s.*, u.name as customer_name, u.email as customer_email,
           p.name as plan_name, p.billing_interval, p.cost as plan_cost, p.auto_close,
           d.id as discount_id, d.code as discount_code, d.type as discount_type,
           d.value as discount_value, d.min_purchase_amount, d.times_used, d.usage_limit, d.is_active as discount_active
    FROM subscriptions s
    JOIN users u ON s.customer_id = u.id
    JOIN plans p ON s.plan_id = p.id
    LEFT JOIN discount_rules d ON s.applied_discount_id = d.id
    WHERE s.status IN ('active', 'confirmed')
      AND (s.next_billing_date IS NULL OR s.next_billing_date <= ?)
  `).all(today);

  const generatedInvoices = [];

  for (const sub of eligibleSubs) {
    // Check if invoice already exists for this billing period to prevent duplicate billing
    const periodStart = sub.next_billing_date || today;
    const nextDate = computeNextBillingDate(periodStart, sub.billing_interval);

    const alreadyBilled = db.prepare(`
      SELECT id FROM invoices
      WHERE subscription_id = ? AND billing_period_start = ?
    `).get(sub.id, periodStart);

    if (alreadyBilled) {
      continue; // Skip: already billed for this cycle!
    }

    // Get lines
    const lines = db.prepare(`
      SELECT sl.*, p.name as product_name, pv.variant_name
      FROM subscription_lines sl
      JOIN products p ON sl.product_id = p.id
      LEFT JOIN product_variants pv ON sl.variant_id = pv.id
      WHERE sl.subscription_id = ?
    `).all(sub.id);

    let subtotal = 0;
    let taxTotal = 0;
    let discountTotal = 0;

    const lineCalculations = lines.map(line => {
      const lineSubtotal = line.quantity * line.unit_price;
      subtotal += lineSubtotal;

      let lineDiscount = 0;
      if (line.discount_rate > 0) {
        lineDiscount = lineSubtotal * (line.discount_rate / 100);
      }
      discountTotal += lineDiscount;

      const taxableAmount = lineSubtotal - lineDiscount;
      const lineTax = taxableAmount * (line.tax_rate / 100);
      taxTotal += lineTax;

      return {
        product_name: line.product_name,
        variant_name: line.variant_name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
        tax_amount: lineTax,
        discount_amount: lineDiscount,
        line_total: taxableAmount + lineTax
      };
    });

    // Apply global discount rule if attached and active
    if (sub.discount_id && sub.discount_active && sub.times_used < sub.usage_limit) {
      if (subtotal >= (sub.min_purchase_amount || 0)) {
        let globalDiscount = 0;
        if (sub.discount_type === 'percentage') {
          globalDiscount = (subtotal - discountTotal) * (sub.discount_value / 100);
        } else {
          globalDiscount = Math.min(sub.discount_value, subtotal - discountTotal);
        }
        discountTotal += globalDiscount;

        // Increment discount usage
        db.prepare('UPDATE discount_rules SET times_used = times_used + 1 WHERE id = ?').run(sub.discount_id);
      }
    }

    const totalAmount = Math.max(0, subtotal - discountTotal + taxTotal);

    // Compute due date based on payment terms
    let daysToAdd = 15;
    if (sub.payment_terms === 'Immediate') daysToAdd = 0;
    else if (sub.payment_terms === 'Net 30') daysToAdd = 30;
    const dueDateObj = new Date(today);
    dueDateObj.setDate(dueDateObj.getDate() + daysToAdd);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    // Generate Invoice Number INV-YYYY-XXXX
    const count = db.prepare('SELECT count(*) as count FROM invoices').get().count + 1;
    const invNumber = `INV-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;

    const invResult = db.prepare(`
      INSERT INTO invoices (
        invoice_number, subscription_id, customer_id, issue_date, due_date,
        subtotal, tax_total, discount_total, total_amount, paid_amount,
        status, billing_period_start, billing_period_end
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'confirmed', ?, ?)
    `).run(
      invNumber, sub.id, sub.customer_id, today, dueDate,
      subtotal, taxTotal, discountTotal, totalAmount,
      periodStart, nextDate
    );

    const invoiceId = Number(invResult.lastInsertRowid);

    const insertInvLine = db.prepare(`
      INSERT INTO invoice_lines (
        invoice_id, product_name, variant_name, quantity, unit_price,
        tax_rate, tax_amount, discount_amount, line_total
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const lc of lineCalculations) {
      insertInvLine.run(
        invoiceId, lc.product_name, lc.variant_name, lc.quantity, lc.unit_price,
        lc.tax_rate, lc.tax_amount, lc.discount_amount, lc.line_total
      );
    }

    // Check auto_close if expiry date has arrived
    let newStatus = 'active';
    if (sub.auto_close && sub.expiry_date && sub.expiry_date <= nextDate) {
      newStatus = 'closed';
    }

    // Advance next billing date and mark subscription active
    db.prepare(`
      UPDATE subscriptions
      SET last_invoiced_date = ?, next_billing_date = ?, status = ?
      WHERE id = ?
    `).run(today, nextDate, newStatus, sub.id);

    generatedInvoices.push({
      id: invoiceId,
      invoice_number: invNumber,
      subscription_number: sub.subscription_number,
      customer_name: sub.customer_name,
      total_amount: totalAmount
    });
  }

  res.json({
    message: `Billing run complete! Generated ${generatedInvoices.length} invoices seamlessly.`,
    count: generatedInvoices.length,
    invoices: generatedInvoices
  });
});

function computeNextBillingDate(startDateStr, interval) {
  const d = new Date(startDateStr);
  if (interval === 'daily') d.setDate(d.getDate() + 1);
  else if (interval === 'weekly') d.setDate(d.getDate() + 7);
  else if (interval === 'monthly') d.setMonth(d.getMonth() + 1);
  else if (interval === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

// Invoices List
app.get('/api/invoices', authenticateToken, (req, res) => {
  let query = `
    SELECT i.*, u.name as customer_name, u.email as customer_email, u.company_name,
           s.subscription_number, s.payment_terms
    FROM invoices i
    JOIN users u ON i.customer_id = u.id
    LEFT JOIN subscriptions s ON i.subscription_id = s.id
  `;

  let invoices;
  if (req.user.role === 'customer') {
    query += ' WHERE i.customer_id = ? ORDER BY i.id DESC';
    invoices = db.prepare(query).all(req.user.id);
  } else {
    query += ' ORDER BY i.id DESC';
    invoices = db.prepare(query).all();
  }

  // Check and flag overdue invoices dynamically
  const today = new Date().toISOString().split('T')[0];
  const formatted = invoices.map(inv => ({
    ...inv,
    is_overdue: inv.status !== 'paid' && inv.status !== 'cancelled' && inv.due_date < today
  }));

  res.json({ invoices: formatted });
});

// Invoice Details with Lines & Payments
app.get('/api/invoices/:id', authenticateToken, (req, res) => {
  const inv = db.prepare(`
    SELECT i.*, u.name as customer_name, u.email as customer_email, u.company_name,
           s.subscription_number, s.payment_terms
    FROM invoices i
    JOIN users u ON i.customer_id = u.id
    LEFT JOIN subscriptions s ON i.subscription_id = s.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  if (req.user.role === 'customer' && inv.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized to view this invoice' });
  }

  const lines = db.prepare('SELECT * FROM invoice_lines WHERE invoice_id = ?').all(inv.id);
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY id DESC').all(inv.id);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = inv.status !== 'paid' && inv.status !== 'cancelled' && inv.due_date < today;

  res.json({ invoice: { ...inv, is_overdue: isOverdue, lines, payments } });
});

// Update Invoice Actions (Confirm, Cancel, Send)
app.patch('/api/invoices/:id/status', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const { status } = req.body;
  const invId = req.params.id;

  if (!['draft', 'confirmed', 'paid', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid invoice status' });
  }

  db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, invId);
  res.json({ message: `Invoice updated to ${status}`, status });
});

app.post('/api/invoices/:id/send', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.prepare('UPDATE invoices SET sent_at = ? WHERE id = ?').run(now, req.params.id);
  res.json({ message: 'Invoice marked as sent and email dispatched!', sent_at: now });
});

// ==========================================
// PAYMENTS
// ==========================================
app.get('/api/payments', authenticateToken, (req, res) => {
  let query = `
    SELECT p.*, i.invoice_number, i.total_amount as invoice_total,
           u.name as customer_name, u.email as customer_email
    FROM payments p
    JOIN invoices i ON p.invoice_id = i.id
    JOIN users u ON i.customer_id = u.id
  `;

  let payments;
  if (req.user.role === 'customer') {
    query += ' WHERE i.customer_id = ? ORDER BY p.id DESC';
    payments = db.prepare(query).all(req.user.id);
  } else {
    query += ' ORDER BY p.id DESC';
    payments = db.prepare(query).all();
  }

  res.json({ payments });
});

app.post('/api/payments', authenticateToken, (req, res) => {
  const { invoice_id, method, amount, payment_date, note } = req.body;
  if (!invoice_id || !method || !amount) {
    return res.status(400).json({ error: 'Invoice, method, and amount are required' });
  }

  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

  // If customer is recording, ensure it's their own invoice
  if (req.user.role === 'customer' && invoice.customer_id !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const paymentAmount = parseFloat(amount);
  const count = db.prepare('SELECT count(*) as count FROM payments').get().count + 1;
  const payNumber = `PAY-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`;
  const payDate = payment_date || new Date().toISOString().split('T')[0];

  const payResult = db.prepare(`
    INSERT INTO payments (invoice_id, payment_number, method, amount, payment_date, note, recorded_by_user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(invoice_id, payNumber, method, paymentAmount, payDate, note || '', req.user.id);

  // Update invoice paid_amount and status
  const newPaidAmount = invoice.paid_amount + paymentAmount;
  let newStatus = invoice.status;
  if (newPaidAmount >= invoice.total_amount) {
    newStatus = 'paid';
  }

  db.prepare(`
    UPDATE invoices
    SET paid_amount = ?, status = ?
    WHERE id = ?
  `).run(newPaidAmount, newStatus, invoice_id);

  res.status(201).json({
    message: 'Payment recorded successfully',
    id: Number(payResult.lastInsertRowid),
    payment_number: payNumber,
    newStatus,
    newPaidAmount
  });
});

// ==========================================
// FINANCE LEAD ANALYTICS & REPORTING
// "With thousands of subscriptions on the books, every page should still respond in under two seconds."
// ==========================================
app.get('/api/analytics', authenticateToken, requireRole('admin', 'staff'), (req, res) => {
  const startTime = Date.now();

  const totalSubs = db.prepare('SELECT count(*) as count FROM subscriptions').get().count;
  const activeSubs = db.prepare("SELECT count(*) as count FROM subscriptions WHERE status = 'active'").get().count;
  const pausedSubs = db.prepare("SELECT count(*) as count FROM subscriptions WHERE status = 'paused'").get().count;
  const quoteSubs = db.prepare("SELECT count(*) as count FROM subscriptions WHERE status IN ('draft', 'quotation')").get().count;

  // Revenue metrics
  const totalRevenue = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments').get().total;

  const totalOutstanding = db.prepare(`
    SELECT COALESCE(SUM(total_amount - paid_amount), 0) as total
    FROM invoices
    WHERE status IN ('confirmed', 'draft')
  `).get().total;

  const today = new Date().toISOString().split('T')[0];
  const overdueInvoices = db.prepare(`
    SELECT count(*) as count, COALESCE(SUM(total_amount - paid_amount), 0) as amount
    FROM invoices
    WHERE status != 'paid' AND status != 'cancelled' AND due_date < ?
  `).get(today);

  // Calculate MRR from active subscriptions
  const activeSubscriptions = db.prepare(`
    SELECT s.id, p.billing_interval,
           (SELECT COALESCE(SUM(amount), 0) FROM subscription_lines WHERE subscription_id = s.id) as sub_total
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.status = 'active'
  `).all();

  let mrr = 0;
  for (const s of activeSubscriptions) {
    let monthlyVal = s.sub_total;
    if (s.billing_interval === 'yearly') monthlyVal = s.sub_total / 12;
    else if (s.billing_interval === 'weekly') monthlyVal = s.sub_total * 4.33;
    else if (s.billing_interval === 'daily') monthlyVal = s.sub_total * 30;
    mrr += monthlyVal;
  }

  const arr = mrr * 12;
  const executionTimeMs = Date.now() - startTime;

  res.json({
    metrics: {
      total_subscriptions: totalSubs,
      active_subscriptions: activeSubs,
      paused_subscriptions: pausedSubs,
      pipeline_subscriptions: quoteSubs,
      total_revenue_collected: totalRevenue,
      total_outstanding: totalOutstanding,
      overdue_count: overdueInvoices.count,
      overdue_amount: overdueInvoices.amount,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100
    },
    performance: {
      response_time_ms: executionTimeMs,
      sla_met: executionTimeMs < 2000
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Brightloop Backend Engine running on http://localhost:${PORT}`);
});

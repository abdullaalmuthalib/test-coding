const BASE_URL = '/api';

export const api = {
  getToken() {
    return localStorage.getItem('brightloop_token');
  },
  setToken(token) {
    if (token) localStorage.setItem('brightloop_token', token);
    else localStorage.removeItem('brightloop_token');
  },
  getUser() {
    try {
      const u = localStorage.getItem('brightloop_user');
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    if (user) localStorage.setItem('brightloop_user', JSON.stringify(user));
    else localStorage.removeItem('brightloop_user');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async register(name, email, password, company_name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, company_name })
    });
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  },

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  },

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword })
    });
  },

  async getMe() {
    return this.request('/auth/me');
  },

  // Users & Staff
  async getUsers() {
    return this.request('/users');
  },

  async createStaff(name, email, password) {
    return this.request('/users/staff', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  // Products
  async getProducts() {
    return this.request('/products');
  },

  async createProduct(productData) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  // Plans
  async getPlans() {
    return this.request('/plans');
  },

  async createPlan(planData) {
    return this.request('/plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  },

  // Taxes
  async getTaxes() {
    return this.request('/taxes');
  },

  async createTax(taxData) {
    return this.request('/taxes', {
      method: 'POST',
      body: JSON.stringify(taxData)
    });
  },

  // Discounts
  async getDiscounts() {
    return this.request('/discounts');
  },

  async createDiscount(discountData) {
    return this.request('/discounts', {
      method: 'POST',
      body: JSON.stringify(discountData)
    });
  },

  // Quotation Templates
  async getTemplates() {
    return this.request('/templates');
  },

  async createTemplate(templateData) {
    return this.request('/templates', {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  },

  // Subscriptions
  async getSubscriptions() {
    return this.request('/subscriptions');
  },

  async getSubscription(id) {
    return this.request(`/subscriptions/${id}`);
  },

  async createSubscription(subData) {
    return this.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subData)
    });
  },

  async updateSubscriptionStatus(id, status) {
    return this.request(`/subscriptions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async renewSubscription(id) {
    return this.request(`/subscriptions/${id}/renew`, {
      method: 'POST'
    });
  },

  // Billing & Invoices
  async runBillingDay(target_date) {
    return this.request('/billing/run-billing-day', {
      method: 'POST',
      body: JSON.stringify({ target_date })
    });
  },

  async seedScale(count = 5000) {
    return this.request('/benchmark/seed-scale', {
      method: 'POST',
      body: JSON.stringify({ count })
    });
  },

  async getInvoices() {
    return this.request('/invoices');
  },

  async getInvoice(id) {
    return this.request(`/invoices/${id}`);
  },

  async updateInvoiceStatus(id, status) {
    return this.request(`/invoices/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async sendInvoice(id) {
    return this.request(`/invoices/${id}/send`, {
      method: 'POST'
    });
  },

  // Payments
  async getPayments() {
    return this.request('/payments');
  },

  async recordPayment(paymentData) {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  },

  // Analytics
  async getAnalytics() {
    return this.request('/analytics');
  }
};

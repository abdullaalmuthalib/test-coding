import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import DashboardTab from './components/DashboardTab.jsx';
import SubscriptionsTab from './components/SubscriptionsTab.jsx';
import InvoicesTab from './components/InvoicesTab.jsx';
import TemplatesTab from './components/TemplatesTab.jsx';
import CatalogTab from './components/CatalogTab.jsx';
import AdminHubTab from './components/AdminHubTab.jsx';
import BenchmarkTab from './components/BenchmarkTab.jsx';
import InvoiceModal from './components/InvoiceModal.jsx';
import NewSubscriptionModal from './components/NewSubscriptionModal.jsx';
import PaymentModal from './components/PaymentModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import { api } from './api.js';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data States
  const [analytics, setAnalytics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [users, setUsers] = useState([]);

  // Modals
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [authModalConfig, setAuthModalConfig] = useState({ isOpen: false, mode: 'login' });
  const [isBillingRunning, setIsBillingRunning] = useState(false);

  // Toast System
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Initial Boot & Demo Login
  useEffect(() => {
    async function boot() {
      setIsLoading(true);
      try {
        const savedUser = api.getUser();
        if (savedUser && api.getToken()) {
          setCurrentUser(savedUser);
          await refreshAllData();
        } else {
          // Default to Admin demo user for comprehensive immediate view
          await switchDemoUser('admin@brightloop.com');
        }
      } catch (err) {
        console.error('Error during initial boot:', err);
        await switchDemoUser('admin@brightloop.com');
      } finally {
        setIsLoading(false);
      }
    }
    boot();
  }, []);

  const switchDemoUser = async (email) => {
    try {
      let pwd = 'Admin@1234';
      if (email === 'staff@brightloop.com') pwd = 'Staff@1234';
      else if (email.includes('novatech') || email.includes('tinkerlabs') || email.includes('hypergrowth')) pwd = 'Cust@1234';

      const data = await api.login(email, pwd);
      setCurrentUser(data.user);
      showToast(`Logged in as ${data.user.name} (${data.user.role.toUpperCase()})`);
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    }
  };

  const refreshAllData = async () => {
    try {
      const [
        analyticsData,
        subsData,
        invoicesData,
        prodsData,
        plansData,
        templatesData,
        discountsData,
        taxesData,
        usersData
      ] = await Promise.all([
        api.getAnalytics().catch(() => null),
        api.getSubscriptions().catch(() => ({ subscriptions: [] })),
        api.getInvoices().catch(() => ({ invoices: [] })),
        api.getProducts().catch(() => ({ products: [] })),
        api.getPlans().catch(() => ({ plans: [] })),
        api.getTemplates().catch(() => ({ templates: [] })),
        api.getDiscounts().catch(() => ({ discounts: [] })),
        api.getTaxes().catch(() => ({ taxes: [] })),
        api.getUsers().catch(() => ({ users: [] }))
      ]);

      if (analyticsData) setAnalytics(analyticsData);
      setSubscriptions(subsData.subscriptions || []);
      setInvoices(invoicesData.invoices || []);
      setProducts(prodsData.products || []);
      setPlans(plansData.plans || []);
      setTemplates(templatesData.templates || []);
      setDiscounts(discountsData.discounts || []);
      setTaxes(taxesData.taxes || []);
      setUsers(usersData.users || []);
    } catch (err) {
      console.error('Error refreshing state:', err);
    }
  };

  // Run Billing Day Engine (with optional simulated date)
  const handleRunBillingDay = async (targetDate) => {
    setIsBillingRunning(true);
    try {
      const res = await api.runBillingDay(targetDate);
      showToast(`⚡ ${res.message}`);
      await refreshAllData();
      setActiveTab('invoices');
    } catch (err) {
      showToast(err.message || 'Failed to run billing day', 'error');
    } finally {
      setIsBillingRunning(false);
    }
  };

  // Open Full Invoice View
  const handleOpenInvoice = async (invoiceId) => {
    try {
      const data = await api.getInvoice(invoiceId);
      setActiveInvoice(data.invoice);
    } catch (err) {
      showToast('Could not load invoice details', 'error');
    }
  };

  // Update Subscription Status
  const handleUpdateSubStatus = async (id, status) => {
    try {
      await api.updateSubscriptionStatus(id, status);
      showToast(`Subscription status updated to ${status.toUpperCase()}!`);
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Status transition rejected', 'error');
    }
  };

  // Renew Subscription
  const handleRenewSub = async (id) => {
    try {
      const res = await api.renewSubscription(id);
      showToast(`🎉 Renewed until ${res.newExpiry}!`);
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Renewal failed', 'error');
    }
  };

  // Create Subscription / Quote
  const handleCreateSubscription = async (subData) => {
    try {
      const res = await api.createSubscription(subData);
      showToast(`Subscription ${res.subscription_number} generated!`);
      setShowNewSubModal(false);
      await refreshAllData();
      setActiveTab('subscriptions');
    } catch (err) {
      showToast(err.message || 'Failed to create subscription', 'error');
    }
  };

  // Record Payment
  const handleRecordPayment = async (paymentData) => {
    try {
      const res = await api.recordPayment(paymentData);
      showToast(`Payment of $${paymentData.amount.toFixed(2)} recorded! Invoice is now ${res.newStatus.toUpperCase()}`);
      setPaymentInvoice(null);
      if (activeInvoice && activeInvoice.id === paymentData.invoice_id) {
        handleOpenInvoice(paymentData.invoice_id);
      }
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to record payment', 'error');
    }
  };

  // Invoice Status
  const handleUpdateInvoiceStatus = async (id, status) => {
    try {
      await api.updateInvoiceStatus(id, status);
      showToast(`Invoice updated to ${status}`);
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to update invoice', 'error');
    }
  };

  // Send Invoice Email
  const handleSendInvoice = async (id) => {
    try {
      await api.sendInvoice(id);
      showToast('Invoice notification dispatched to customer email! ✉️');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to send invoice', 'error');
    }
  };

  // Create Product
  const handleCreateProduct = async (productData) => {
    try {
      await api.createProduct(productData);
      showToast('Product and variants added to catalog!');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to create product', 'error');
    }
  };

  // Create Plan
  const handleCreatePlan = async (planData) => {
    try {
      await api.createPlan(planData);
      showToast('Billing plan configured successfully!');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to create plan', 'error');
    }
  };

  // Create Quotation Template
  const handleCreateTemplate = async (templateData) => {
    try {
      await api.createTemplate(templateData);
      showToast('Quotation template created successfully!');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to create template', 'error');
    }
  };

  // Create Discount Rule
  const handleCreateDiscount = async (discountData) => {
    try {
      await api.createDiscount(discountData);
      showToast(`Discount code ${discountData.code} created!`);
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to create discount', 'error');
    }
  };

  // Create Tax
  const handleCreateTax = async (taxData) => {
    try {
      await api.createTax(taxData);
      showToast('Tax rule created successfully!');
      await refreshAllData();
    } catch (err) {
      showToast(err.message || 'Failed to create tax rule', 'error');
    }
  };

  // Create Staff
  const handleCreateStaff = async (staffData) => {
    try {
      await api.createStaff(staffData.name, staffData.email, staffData.password);
      showToast(`Staff account for ${staffData.name} activated!`);
      await refreshAllData();
    } catch (err) {
      throw err;
    }
  };

  const overdueCount = invoices.filter(i => i.is_overdue).length;
  const quotesCount = subscriptions.filter(s => ['draft', 'quotation'].includes(s.status)).length;

  return (
    <div className="min-h-screen bg-tinker-canvas flex flex-row">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-bounce">
          <div className={`px-4 py-2.5 rounded-2xl border-2 border-tinker-border shadow-neo flex items-center gap-2 text-xs font-black ${
            toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-tinker-yellow text-black'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Sparkles className="w-4 h-4 fill-black" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Desktop Web App Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchUser={switchDemoUser}
        onLogout={() => {
          api.setToken(null);
          api.setUser(null);
          setCurrentUser(null);
          setAuthModalConfig({ isOpen: true, mode: 'login' });
        }}
        onOpenAuth={(mode) => setAuthModalConfig({ isOpen: true, mode })}
        overdueCount={overdueCount}
        quotesCount={quotesCount}
        analytics={analytics}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <Header
          currentUser={currentUser}
          onSwitchUser={switchDemoUser}
          onLogout={() => {
            api.setToken(null);
            api.setUser(null);
            setCurrentUser(null);
            setAuthModalConfig({ isOpen: true, mode: 'login' });
          }}
          onOpenAuth={(mode) => setAuthModalConfig({ isOpen: true, mode })}
          onRunBillingDay={handleRunBillingDay}
          isBillingRunning={isBillingRunning}
          analytics={analytics}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <div className="w-10 h-10 border-4 border-tinker-yellow border-t-black rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-zinc-500">Connecting to Brightloop SQLite Engine...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardTab
                  analytics={analytics}
                  invoices={invoices}
                  subscriptions={subscriptions}
                  currentUser={currentUser}
                  onRunBillingDay={() => handleRunBillingDay()}
                  onOpenInvoice={handleOpenInvoice}
                  onOpenPayment={(inv) => setPaymentInvoice(inv)}
                  onOpenNewSub={() => setShowNewSubModal(true)}
                  isBillingRunning={isBillingRunning}
                />
              )}

              {activeTab === 'subscriptions' && (
                <SubscriptionsTab
                  subscriptions={subscriptions}
                  currentUser={currentUser}
                  onOpenNewSub={() => setShowNewSubModal(true)}
                  onUpdateStatus={handleUpdateSubStatus}
                  onRenewSub={handleRenewSub}
                  onViewSubscriptionDetails={(id) => {}}
                />
              )}

              {activeTab === 'invoices' && (
                <InvoicesTab
                  invoices={invoices}
                  currentUser={currentUser}
                  onOpenInvoice={handleOpenInvoice}
                  onOpenPayment={(inv) => setPaymentInvoice(inv)}
                  onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                  onSendInvoice={handleSendInvoice}
                />
              )}

              {activeTab === 'templates' && (
                <TemplatesTab
                  templates={templates}
                  products={products}
                  plans={plans}
                  currentUser={currentUser}
                  onCreateTemplate={handleCreateTemplate}
                  onApplyTemplateToQuote={(tpl) => {
                    setShowNewSubModal(true);
                  }}
                />
              )}

              {activeTab === 'catalog' && (
                <CatalogTab
                  products={products}
                  plans={plans}
                  currentUser={currentUser}
                  onCreateProduct={handleCreateProduct}
                  onCreatePlan={handleCreatePlan}
                />
              )}

              {activeTab === 'discounts' && (
                <AdminHubTab
                  currentUser={currentUser}
                  discounts={discounts}
                  taxes={taxes}
                  users={users}
                  products={products}
                  onCreateDiscount={handleCreateDiscount}
                  onCreateTax={handleCreateTax}
                  onCreateStaff={handleCreateStaff}
                />
              )}

              {activeTab === 'admin' && (
                <AdminHubTab
                  currentUser={currentUser}
                  discounts={discounts}
                  taxes={taxes}
                  users={users}
                  products={products}
                  onCreateDiscount={handleCreateDiscount}
                  onCreateTax={handleCreateTax}
                  onCreateStaff={handleCreateStaff}
                />
              )}

              {activeTab === 'benchmark' && (
                <BenchmarkTab
                  analytics={analytics}
                  subscriptions={subscriptions}
                  onRefreshAll={refreshAllData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      {activeInvoice && (
        <InvoiceModal
          invoice={activeInvoice}
          onClose={() => setActiveInvoice(null)}
          onPrint={() => window.print()}
        />
      )}

      {paymentInvoice && (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onRecord={handleRecordPayment}
        />
      )}

      {showNewSubModal && (
        <NewSubscriptionModal
          currentUser={currentUser}
          products={products}
          plans={plans}
          users={users}
          templates={templates}
          discounts={discounts}
          onClose={() => setShowNewSubModal(false)}
          onCreate={handleCreateSubscription}
        />
      )}

      {authModalConfig.isOpen && (
        <AuthModal
          initialMode={authModalConfig.mode}
          onClose={() => setAuthModalConfig({ isOpen: false, mode: 'login' })}
          onLoginSuccess={(user, token) => {
            api.setToken(token);
            api.setUser(user);
            setCurrentUser(user);
            showToast(`Welcome, ${user.name}!`);
            refreshAllData();
          }}
        />
      )}
    </div>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { EnvironmentProvider } from './contexts/EnvironmentContext';
import { LandingPage } from './pages/LandingPage';
import { UnifiedAuthPage } from './pages/auth/UnifiedAuthPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { Dashboard } from './pages/Dashboard';
import { SendMoney } from './pages/SendMoney';
import { ProductsPage } from './pages/ProductsPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { DeveloperWorkspace } from './pages/DeveloperWorkspace';
import { PricingPage } from './pages/PricingPage';
import { AboutPage } from './pages/AboutPage';
import { CustomersPage } from './pages/CustomersPage';
import { BlogPage } from './pages/BlogPage';
import { BlogPost } from './pages/BlogPost';
import { CareersPage } from './pages/CareersPage';
import { JobDetail } from './pages/JobDetail';
import { TransactionsPage } from './pages/TransactionsPage';
import { ContactsPage } from './pages/ContactsPage';
import { Settings } from './pages/Settings';
import { AddMoney } from './pages/AddMoney';
import { LinkCard } from './pages/LinkCard';
import { Withdraw } from './pages/Withdraw';
import { Notifications } from './pages/Notifications';
import { PaymentLinks } from './pages/PaymentLinks';
import { PaymentLinkPage } from './pages/PaymentLinkPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { CreateInvoice } from './pages/CreateInvoice';
import { EditInvoice } from './pages/EditInvoice';
import { PayInvoice } from './pages/PayInvoice';
import { Reports } from './pages/Reports';
import { MerchantActivation } from './pages/MerchantActivation';
import { MerchantDashboard } from './pages/MerchantDashboard';
import { MerchantOnboarding } from './pages/MerchantOnboarding';
import { AdvancedAnalytics } from './pages/AdvancedAnalytics';
import { ComplianceRequirements } from './pages/ComplianceRequirements';
import { CompanyRegistration } from './pages/CompanyRegistration';
import { UnifiedGateway } from './pages/Gateway';
import SubscriptionCheckout from './pages/SubscriptionCheckout';
import { VirtualCards } from './pages/VirtualCards';
import { SendInvoicePage } from './pages/SendInvoicePage';
import { CollectionsOverview } from './pages/CollectionsOverview';
import { PayoutsOverview } from './pages/PayoutsOverview';
import { TeamsOverview } from './pages/TeamsOverview';
import { PaymentLinksOverview } from './pages/PaymentLinksOverview';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { PaymentsOverviewPage } from './pages/PaymentsOverviewPage';
import { PosSystemsPage } from './pages/PosSystemsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { MerchantServiceAgreementPage } from './pages/MerchantServiceAgreementPage';
import { CookiePolicyPage } from './pages/CookiePolicyPage';
import { SecurityPage } from './pages/SecurityPage';
import { DocumentationHubPage } from './pages/docs/DocumentationHubPage';
import { StatusPage } from './pages/StatusPage';
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminTransactions } from './pages/admin/AdminTransactions';
import { AdminMerchants } from './pages/admin/AdminMerchants';
import { AdminMerchantReview } from './pages/admin/AdminMerchantReview';
import { AdminCMS } from './pages/admin/AdminCMS';
import { AdminEscrowManagement } from './pages/admin/AdminEscrowManagement';
import { AdminNotifications } from './pages/admin/AdminNotifications';
import { AdminEscrowDetail } from './pages/admin/AdminEscrowDetail';
import { AdminSubMerchants } from './pages/admin/AdminSubMerchants';
import { AdminSubMerchantReview } from './pages/admin/AdminSubMerchantReview';
import { AdminApplications } from './pages/admin/AdminApplications';
import { AllTransactions } from './pages/AllTransactions';
import { FXLiquidityPool } from './pages/FXLiquidityPool';
import { FXLiquidityPoolInfo } from './pages/FXLiquidityPoolInfo';
import { InvoicingOverview } from './pages/InvoicingOverview';
import { RequestFunds } from './pages/RequestFunds';
import { PayRequest } from './pages/PayRequest';
import { QrPaymentsInfo } from './pages/QrPaymentsInfo';
import { VendorPortal } from './pages/VendorPortal';
import SubscriptionsHub from './pages/merchant/subscriptions/SubscriptionsHub';
import SubscriptionProducts from './pages/merchant/subscriptions/SubscriptionProducts';
import SubscriptionCustomers from './pages/merchant/subscriptions/SubscriptionCustomers';
import SubscriptionProductDetail from './pages/merchant/subscriptions/SubscriptionProductDetail';
import SubscriptionDetail from './pages/merchant/subscriptions/SubscriptionDetail';
import SubscriptionInvoiceDetail from './pages/merchant/subscriptions/InvoiceDetail';
import CouponsPage from './pages/merchant/subscriptions/CouponsPage';
import BillingSettingsPage from './pages/merchant/subscriptions/BillingSettingsPage';
import SubscriptionPortal from './pages/SubscriptionPortal';
import { ClaimFundsPage } from './pages/ClaimFundsPage';



// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  // Simple check. Real app might check token expiry.
  if (!isAuthenticated && !token) {
    return <Navigate to="/signup?mode=login" replace />;
  }
  return children;
};

// Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user, token } = useAuth();
  if (!isAuthenticated && !token) {
    return <Navigate to="/signup?mode=login" replace />;
  }
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Navigate to="/signup?mode=login" replace />} />
      <Route path="/signup" element={<UnifiedAuthPage />} />
      <Route path="/create-account" element={<Navigate to="/signup" replace />} />
      <Route path="/signup/individual" element={<Navigate to="/signup?account=individual&mode=signup" replace />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/claim/:token" element={<ClaimFundsPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/solutions" element={<SolutionsPage />} />
      <Route path="/developers" element={<DevelopersPage />} />
      <Route path="/developers/api-keys" element={<ProtectedRoute><DeveloperWorkspace /></ProtectedRoute>} />
      <Route path="/developers/activity" element={<ProtectedRoute><DeveloperWorkspace /></ProtectedRoute>} />
      <Route path="/developers/environments" element={<ProtectedRoute><DeveloperWorkspace /></ProtectedRoute>} />
      <Route path="/merchant/login" element={<Navigate to="/signup?account=business&mode=login" replace />} />
      <Route path="/merchant/signup" element={<Navigate to="/signup?account=business&mode=signup" replace />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/careers/:slug" element={<JobDetail />} />
      <Route path="/fx-liquidity" element={<FXLiquidityPoolInfo />} />
      <Route path="/payouts" element={<PayoutsOverview />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/send"
        element={
          <ProtectedRoute>
            <SendMoney />
          </ProtectedRoute>
        }
      />
      <Route
        path="/request-funds"
        element={
          <ProtectedRoute>
            <RequestFunds />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AllTransactions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fx-pool"
        element={
          <ProtectedRoute>
            <FXLiquidityPool />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <ContactsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-money"
        element={
          <ProtectedRoute>
            <AddMoney />
          </ProtectedRoute>
        }
      />
      <Route
        path="/link-card"
        element={
          <ProtectedRoute>
            <LinkCard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/withdraw"
        element={
          <ProtectedRoute>
            <Withdraw />
          </ProtectedRoute>
        }
      />
      <Route
        path="/virtual-cards"
        element={
          <ProtectedRoute>
            <VirtualCards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pay-links"
        element={
          <ProtectedRoute>
            <PaymentLinks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute>
            <InvoicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/create"
        element={
          <ProtectedRoute>
            <CreateInvoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute>
            <InvoiceDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id/edit"
        element={
          <ProtectedRoute>
            <EditInvoice />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id/send"
        element={
          <ProtectedRoute>
            <SendInvoicePage />
          </ProtectedRoute>
        }
      />

      {/* Public Payment Route - No ProbtectedRoute wrapper */}
      <Route path="/pay/inv/:id" element={<PayInvoice />} />

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/*"
        element={
          <ProtectedRoute>
            <Navigate to="/merchant/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/settings"
        element={
          <ProtectedRoute>
            <MerchantActivation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/dashboard"
        element={
          <ProtectedRoute>
            <MerchantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/onboarding"
        element={
          <ProtectedRoute>
            <MerchantOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/analytics"
        element={
          <ProtectedRoute>
            <AdvancedAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/compliance-requirements"
        element={
          <ProtectedRoute>
            <ComplianceRequirements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/compliance"
        element={
          <ProtectedRoute>
            <CompanyRegistration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions"
        element={
          <ProtectedRoute>
            <SubscriptionsHub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions/products"
        element={
          <ProtectedRoute>
            <SubscriptionProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions/customers"
        element={
          <ProtectedRoute>
            <SubscriptionCustomers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions/products/:id"
        element={
          <ProtectedRoute>
            <SubscriptionProductDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions/:id"
        element={
          <ProtectedRoute>
            <SubscriptionDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions/invoices/:id"
        element={
          <ProtectedRoute>
            <SubscriptionInvoiceDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions/coupons"
        element={
          <ProtectedRoute>
            <CouponsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/subscriptions/settings"
        element={
          <ProtectedRoute>
            <BillingSettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Customer Self-Service Portal (public, token-gated) */}
      <Route path="/subscriptions/portal/:token" element={<SubscriptionPortal />} />

      {/* Unified Gateways - Public Payment Routes */}
      <Route path="/checkout/:id" element={<UnifiedGateway />} />
      <Route path="/checkout/subscription/:id" element={<SubscriptionCheckout />} />

      {/* Public Request Payment Route */}
      <Route path="/pay-request/:id" element={<PayRequest />} />

      {/* Public Feature Overview Pages */}
      <Route path="/collections" element={<CollectionsOverview />} />
      <Route path="/payouts" element={<PayoutsOverview />} />
      <Route path="/teams" element={<TeamsOverview />} />
      <Route path="/pay-links-overview" element={<PaymentLinksOverview />} />
      <Route path="/help" element={<HelpCenterPage />} />
      <Route path="/payments-overview" element={<PaymentsOverviewPage />} />
      <Route path="/pos-systems" element={<PosSystemsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/merchant-service-agreement" element={<MerchantServiceAgreementPage />} />
      <Route path="/cookies" element={<CookiePolicyPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/documentation" element={<Navigate to="/documentation/introduction" replace />} />
      <Route path="/documentation/:section" element={<DocumentationHubPage />} />
      <Route path="/status" element={<StatusPage />} />
      <Route path="/invoicing" element={<InvoicingOverview />} />
      <Route path="/qr-payments/:id" element={<PaymentLinkPage />} />
      <Route path="/qr-payments" element={<QrPaymentsInfo />} />


      {/* Admin Suite */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="merchants" element={<AdminMerchants />} />
        <Route path="merchants/:id/kyc" element={<AdminMerchantReview />} />
        <Route path="sub-merchants" element={<AdminSubMerchants />} />
        <Route path="sub-merchants/:id" element={<AdminSubMerchantReview />} />
        <Route path="escrows" element={<AdminEscrowManagement />} />
        <Route path="escrows/:id" element={<AdminEscrowDetail />} />
        <Route path="recruitment/applications" element={<AdminApplications />} />
        <Route path="cms" element={<AdminCMS />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="/pay/:id" element={<PaymentLinkPage />} />
      <Route
        path="/escrow/*"
        element={
          <ProtectedRoute>
            <Navigate to="/merchant/dashboard" replace />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}


function App() {
  return (
    <AuthProvider>
      <EnvironmentProvider>
        <NotificationProvider>
          <Router>
            <AppRoutes />
          </Router>
        </NotificationProvider>
      </EnvironmentProvider>
    </AuthProvider>
  );
}

export default App;

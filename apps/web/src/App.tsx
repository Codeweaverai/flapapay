import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/auth/SignInPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { Dashboard } from './pages/Dashboard';
import { SendMoney } from './pages/SendMoney';
import { ProductsPage } from './pages/ProductsPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { DevelopersPage } from './pages/DevelopersPage';
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
import { EscrowGateway } from './pages/EscrowGateway';
import { UnifiedGateway } from './pages/Gateway';
import SubscriptionCheckout from './pages/SubscriptionCheckout';
import { ConnectDashboard } from './pages/ConnectDashboard';
import { SubMerchantOnboarding } from './pages/SubMerchantOnboarding';
import { VirtualCards } from './pages/VirtualCards';
import { SendInvoicePage } from './pages/SendInvoicePage';
import { CollectionsOverview } from './pages/CollectionsOverview';
import { PayoutsOverview } from './pages/PayoutsOverview';
import { TeamsOverview } from './pages/TeamsOverview';
import { PaymentLinksOverview } from './pages/PaymentLinksOverview';
import { HelpCenterPage } from './pages/HelpCenterPage';
import { PaymentsOverviewPage } from './pages/PaymentsOverviewPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { MerchantServiceAgreementPage } from './pages/MerchantServiceAgreementPage';
import { SecurityPage } from './pages/SecurityPage';
import { DocumentationPage } from './pages/DocumentationPage';
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
import { MerchantAuth } from './pages/auth/MerchantAuth';
import { BulkRemittanceInfo } from './pages/BulkRemittanceInfo';
import { AllTransactions } from './pages/AllTransactions';
import { FXLiquidityPool } from './pages/FXLiquidityPool';
import { FXLiquidityPoolInfo } from './pages/FXLiquidityPoolInfo';
import { InvoicingOverview } from './pages/InvoicingOverview';
import { RequestFunds } from './pages/RequestFunds';
import { PayRequest } from './pages/PayRequest';
import { QrPaymentsInfo } from './pages/QrPaymentsInfo';
import { VendorPortal } from './pages/VendorPortal';
import { ConnectSettings } from './pages/ConnectSettings';
import { WebhooksPage } from './pages/WebhooksPage';
import { ConnectAnalytics } from './pages/ConnectAnalytics';
import { ConnectKYCReview } from './pages/ConnectKYCReview';
import { ConnectDisputesPage } from './pages/ConnectDisputesPage';
import ConnectInvitesPage from './pages/ConnectInvitesPage';
import ConnectLedgerPage from './pages/ConnectLedgerPage';
import InviteRegistrationPage from './pages/InviteRegistrationPage';
import HostedOnboardingPage from './pages/HostedOnboardingPage';
import PayoutRequestsPage from './pages/PayoutRequestsPage';
import SubMerchantPortal from './pages/SubMerchantPortal';
import RiskDashboard from './pages/RiskDashboard';
import WebhookDeliveriesPage from './pages/WebhookDeliveriesPage';
import ConnectEarningsPage from './pages/ConnectEarningsPage';
import ConnectNotificationsPage from './pages/ConnectNotificationsPage';
import ConnectChargesPage from './pages/ConnectChargesPage';
import ConnectAPIReferencePage from './pages/ConnectAPIReferencePage';
import { ConnectComponentsShowcase } from './pages/ConnectComponentsShowcase';
import { BulkRemittance } from './pages/BulkRemittance';
import { EscrowDashboard } from './pages/EscrowDashboard';
import { CreateEscrow } from './pages/CreateEscrow';
import { EscrowDetail } from './pages/EscrowDetail';
import { PublicEscrowView } from './pages/PublicEscrowView';
import { EscrowMarketplaceInfo } from './pages/EscrowMarketplaceInfo';
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
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Wrapper
const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user, token } = useAuth();
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
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
      <Route path="/login" element={<SignInPage initialTab="login" />} />
      <Route path="/signup" element={<SignInPage initialTab="register" />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/claim/:token" element={<ClaimFundsPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/solutions" element={<SolutionsPage />} />
      <Route path="/developers" element={<DevelopersPage />} />
      <Route path="/merchant/login" element={<MerchantAuth mode="login" />} />
      <Route path="/merchant/signup" element={<MerchantAuth mode="signup" />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/customers" element={<CustomersPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:slug" element={<BlogPost />} />
      <Route path="/careers" element={<CareersPage />} />
      <Route path="/careers/:slug" element={<JobDetail />} />
      <Route path="/fx-liquidity" element={<FXLiquidityPoolInfo />} />
      <Route path="/bulk-remittances" element={<BulkRemittanceInfo />} />
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
        path="/merchant/connect"
        element={
          <ProtectedRoute>
            <ConnectDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/onboard"
        element={
          <ProtectedRoute>
            <SubMerchantOnboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/vendor/:accountId"
        element={
          <ProtectedRoute>
            <VendorPortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/settings"
        element={
          <ProtectedRoute>
            <ConnectSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/webhooks"
        element={
          <ProtectedRoute>
            <WebhooksPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/analytics"
        element={
          <ProtectedRoute>
            <ConnectAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/kyc"
        element={
          <ProtectedRoute>
            <ConnectKYCReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/disputes"
        element={
          <ProtectedRoute>
            <ConnectDisputesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/invites"
        element={
          <ProtectedRoute>
            <ConnectInvitesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/ledger"
        element={
          <ProtectedRoute>
            <ConnectLedgerPage />
          </ProtectedRoute>
        }
      />
      <Route path="/connect/invite/:token" element={<InviteRegistrationPage />} />
      <Route path="/connect/onboarding/:token" element={<HostedOnboardingPage />} />
      <Route path="/sub-merchant" element={<SubMerchantPortal />} />
      <Route
        path="/merchant/connect/risk"
        element={
          <ProtectedRoute>
            <RiskDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/webhook-deliveries"
        element={
          <ProtectedRoute>
            <WebhookDeliveriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/earnings"
        element={
          <ProtectedRoute>
            <ConnectEarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/notifications"
        element={
          <ProtectedRoute>
            <ConnectNotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/payout-requests"
        element={
          <ProtectedRoute>
            <PayoutRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/charges"
        element={
          <ProtectedRoute>
            <ConnectChargesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/api-reference"
        element={
          <ProtectedRoute>
            <ConnectAPIReferencePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/merchant/connect/components"
        element={
          <ProtectedRoute>
            <ConnectComponentsShowcase />
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
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/merchant-service-agreement" element={<MerchantServiceAgreementPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/documentation" element={<DocumentationPage />} />
      <Route path="/status" element={<StatusPage />} />
      <Route path="/invoicing" element={<InvoicingOverview />} />
      <Route path="/qr-payments" element={<QrPaymentsInfo />} />
      <Route path="/escrow-marketplace" element={<EscrowMarketplaceInfo />} />


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
        <Route path="cms" element={<AdminCMS />} />
        <Route path="notifications" element={<AdminNotifications />} />
      </Route>

      <Route path="/escrow-gateway/:id" element={<EscrowGateway />} />
      <Route path="/pay/:id" element={<PaymentLinkPage />} />
      <Route
        path="/merchant/bulk-remittance"
        element={
          <ProtectedRoute>
            <BulkRemittance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrow"
        element={
          <ProtectedRoute>
            <EscrowDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrow/create"
        element={
          <ProtectedRoute>
            <CreateEscrow />
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrow/:id"
        element={
          <ProtectedRoute>
            <EscrowDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/escrow/public/:id"
        element={<PublicEscrowView />}
      />
    </Routes>
  );
}


function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;

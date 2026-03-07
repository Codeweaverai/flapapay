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
import { MerchantAuth } from './pages/auth/MerchantAuth';
import { BulkRemittanceInfo } from './pages/BulkRemittanceInfo';
import { FXLiquidityPool } from './pages/FXLiquidityPool';
import { FXLiquidityPoolInfo } from './pages/FXLiquidityPoolInfo';
import { InvoicingOverview } from './pages/InvoicingOverview';
import { RequestFunds } from './pages/RequestFunds';
import { PayRequest } from './pages/PayRequest';
import { QrPaymentsInfo } from './pages/QrPaymentsInfo';
import { VendorPortal } from './pages/VendorPortal';
import { BulkRemittance } from './pages/BulkRemittance';
import { EscrowDashboard } from './pages/EscrowDashboard';
import { CreateEscrow } from './pages/CreateEscrow';
import { EscrowDetail } from './pages/EscrowDetail';
import { PublicEscrowView } from './pages/PublicEscrowView';
import { EscrowMarketplaceInfo } from './pages/EscrowMarketplaceInfo';


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
            <TransactionsPage />
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

      {/* Unified Gateway - Public Payment Route */}
      <Route path="/checkout/:id" element={<UnifiedGateway />} />

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

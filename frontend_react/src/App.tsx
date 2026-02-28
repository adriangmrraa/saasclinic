import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SaaSLayout } from './components/SaaSLayout';
import SaaSLandingView from './views/landing/SaaSLandingView';
import WizardRegistrationView from './views/onboarding/WizardRegistrationView';
import PaywallView from './views/onboarding/PaywallView';
import CrmDashboardView from './views/CrmDashboardView';
import ChatsView from './views/ChatsView';
import LoginView from './views/LoginView';
import LandingView from './views/LandingView';
import UserApprovalView from './views/UserApprovalView';
import ProfileView from './views/ProfileView';
import CompaniesView from './views/CompaniesView';
import ConfigView from './views/ConfigView';
import LeadsView from './modules/crm_sales/views/LeadsView';
import LeadDetailView from './modules/crm_sales/views/LeadDetailView';
import MetaLeadsView from './views/MetaLeadsView';
import SellersView from './modules/crm_sales/views/SellersView';
import ClientsView from './modules/crm_sales/views/ClientsView';
import ClientDetailView from './modules/crm_sales/views/ClientDetailView';
import CrmAgendaView from './modules/crm_sales/views/CrmAgendaView';
import ProspectingView from './modules/crm_sales/views/ProspectingView';
import MarketingHubView from './views/marketing/MarketingHubView';
import MetaTemplatesView from './views/marketing/MetaTemplatesView';
// Optional Notifications Pages
import NotificationsView from './views/NotificationsView';
// Legal Pages
import PrivacyTermsView from './views/PrivacyTermsView';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <LanguageProvider>
            <SocketProvider>
              <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="/demo" element={<LandingView />} />
                <Route path="/legal" element={<PrivacyTermsView />} />
                <Route path="/privacy" element={<PrivacyTermsView />} />
                <Route path="/terms" element={<PrivacyTermsView />} />

                {/* --- SaaS Public Routes --- */}
                <Route path="/" element={
                  <SaaSLayout>
                    <SaaSLandingView />
                  </SaaSLayout>
                } />
                <Route path="/registro" element={
                  <SaaSLayout>
                    <WizardRegistrationView />
                  </SaaSLayout>
                } />

                {/* --- CRM Protected Routes --- */}
                <Route path="/crm/*" element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        {/* Define explicitly the /crm base relative to /crm/* */}
                        <Route index element={<CrmDashboardView />} />
                        <Route path="agenda" element={<CrmAgendaView />} />
                        <Route path="pacientes" element={<Navigate to="/crm/clientes" replace />} />
                        <Route path="pacientes/:id" element={<Navigate to="/crm/clientes" replace />} />
                        <Route path="chats" element={<ChatsView />} />
                        <Route path="aprobaciones" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <UserApprovalView />
                          </ProtectedRoute>
                        } />
                        <Route path="empresas" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <CompaniesView />
                          </ProtectedRoute>
                        } />
                        <Route path="configuracion" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <ConfigView />
                          </ProtectedRoute>
                        } />
                        <Route path="leads" element={<LeadsView />} />
                        <Route path="leads/:id" element={<LeadDetailView />} />
                        <Route path="meta-leads" element={
                          <ProtectedRoute allowedRoles={['ceo', 'setter', 'closer', 'secretary']}>
                            <MetaLeadsView />
                          </ProtectedRoute>
                        } />
                        <Route path="clientes" element={<ClientsView />} />
                        <Route path="clientes/:id" element={<ClientDetailView />} />
                        <Route path="prospeccion" element={
                          <ProtectedRoute allowedRoles={['ceo', 'setter', 'closer']}>
                            <ProspectingView />
                          </ProtectedRoute>
                        } />
                        <Route path="vendedores" element={
                          <ProtectedRoute allowedRoles={['ceo']}>
                            <SellersView />
                          </ProtectedRoute>
                        } />
                        {/* Paywall Route */}
                        <Route path="paywall" element={<PaywallView />} />
                        {/* Marketing Routes */}
                        <Route path="marketing" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin', 'marketing']}>
                            <MarketingHubView />
                          </ProtectedRoute>
                        } />
                        <Route path="hsm" element={
                          <ProtectedRoute allowedRoles={['ceo', 'admin', 'setter', 'closer']}>
                            <MetaTemplatesView />
                          </ProtectedRoute>
                        } />
                        <Route path="notificaciones" element={<NotificationsView />} />
                        <Route path="perfil" element={<ProfileView />} />
                        <Route path="*" element={<Navigate to="/crm" replace />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </SocketProvider>
          </LanguageProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

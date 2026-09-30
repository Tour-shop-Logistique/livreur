import { Routes, Route } from 'react-router-dom';
import MobileLayout from './layouts/MobileLayout';
import DetailLayout from './layouts/DetailLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { ROUTES } from './routes';
import useRealtime from './hooks/useRealtime';

import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import PendingValidationPage from './pages/Auth/PendingValidationPage';
import ForgotPasswordPage from './pages/Auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/Auth/ResetPasswordPage';
import HomeDashboardPage from './pages/Home/HomeDashboardPage';
import MissionsPage from './pages/Missions/MissionsPage';
import MissionDetailPage from './pages/Missions/MissionDetailPage';
import MarketplaceDetailPage from './pages/Missions/MarketplaceDetailPage';
import EarningsPage from './pages/Earnings/EarningsPage';
import AbonnementPage from './pages/Abonnement/AbonnementPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  // Chargement des donnees metier, WebSocket et rafraichissement au retour
  // au premier plan (restaure aussi la session via GET /livreur/profil).
  useRealtime();

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
      <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
      <Route path={ROUTES.PENDING_VALIDATION} element={<PendingValidationPage />} />
      <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute><MobileLayout /></ProtectedRoute>}>
        <Route path={ROUTES.HOME} element={<HomeDashboardPage />} />
        <Route path={ROUTES.MISSIONS} element={<MissionsPage />} />
        <Route path={ROUTES.EARNINGS} element={<EarningsPage />} />
        <Route path={ROUTES.NOTIFICATIONS} element={<NotificationsPage />} />
        <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
      </Route>

      <Route element={<ProtectedRoute><DetailLayout /></ProtectedRoute>}>
        <Route path={ROUTES.MISSION_DETAIL} element={<MissionDetailPage />} />
        <Route path={ROUTES.MARKETPLACE_DETAIL} element={<MarketplaceDetailPage />} />
        <Route path={ROUTES.ABONNEMENT} element={<AbonnementPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

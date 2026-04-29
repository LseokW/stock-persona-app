import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import LoginCallback from "./pages/LoginCallback";
import Dashboard from "./pages/Dashboard";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import BacktestPage from "./pages/BacktestPage";
import PersonaDetailPage from "./pages/PersonaDetailPage";
import GuidePage from "./pages/GuidePage";
import LSTMGuidePage from "./pages/LSTMGuidePage";

function RootRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login/callback" element={<LoginCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/success"
          element={
            <ProtectedRoute>
              <CheckoutSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout/:persona"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/backtest/:persona"
          element={
            <ProtectedRoute>
              <BacktestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/persona/:persona"
          element={
            <ProtectedRoute>
              <PersonaDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="/lstm-guide" element={<LSTMGuidePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

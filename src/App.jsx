import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/layout/Sidebar';
import RiskAdvisor from './components/RiskAdvisor';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import Onboarding from './pages/Onboarding';
import Policies from './pages/Policies';
import Claims from './pages/Claims';
import Triggers from './pages/Triggers';
import Analytics from './pages/Analytics';
import Weather from './pages/Weather';
import Login from './pages/Login';
import { CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import './App.css';

function ToastContainer() {
  const { toasts } = useApp();
  if (!toasts.length) return null;

  const iconMap = {
    success: <CheckCircle size={18} />,
    error: <AlertCircle size={18} />,
    warning: <AlertTriangle size={18} />,
    info: <Info size={18} />,
  };

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {iconMap[toast.type] || iconMap.info}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  const { isAdmin, isLoggedIn } = useApp();

  if (!isLoggedIn) {
    return (
      <div className="login-layout">
        <Routes>
          <Route path="*" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Routes>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={isAdmin ? <AdminDashboard /> : <WorkerDashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/claims" element={<Claims />} />
          <Route path="/triggers" element={<Triggers />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/weather" element={<Weather />} />
        </Routes>
      </main>
      {isAdmin && <RiskAdvisor />}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

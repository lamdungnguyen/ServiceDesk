import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import AgentWorkspace from './pages/AgentWorkspace';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin';
import CustomerPortal from './pages/CustomerPortal';
import LandingPage from './pages/LandingPage';
import MyTickets from './pages/MyTickets';
import Notifications from './pages/Notifications';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/auth';
import RoleRoute from './components/RoleRoute';
import CustomerChatBubble from './components/CustomerChatBubble';

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isLanding = location.pathname === '/';
  
  return (
    <>
      {!isLanding && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer-portal" element={<CustomerPortal />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/my-tickets" />} />
        <Route path="/staff/login" element={!user ? <StaffLogin /> : <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/staff/dashboard'} />} />
        
        {/* Customer Routes */}
        <Route element={<RoleRoute allowedRoles={['CUSTOMER']} />}>
          <Route path="/my-tickets" element={<MyTickets />} />
        </Route>

        {/* Staff Routes */}
        <Route element={<RoleRoute allowedRoles={['AGENT']} />}>
          <Route path="/staff/dashboard" element={<AgentWorkspace />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* Notifications - all roles */}
        <Route element={<RoleRoute allowedRoles={['CUSTOMER', 'AGENT', 'ADMIN']} />}>
          <Route path="/notifications" element={<Notifications />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  const [isDarkMode] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <AuthProvider>
      <Router>
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
          <AppRoutes />
          <CustomerChatBubble />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

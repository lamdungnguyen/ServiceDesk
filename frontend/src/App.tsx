import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AgentWorkspace from './pages/AgentWorkspace';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import StaffLogin from './pages/StaffLogin';
import CustomerPortal from './pages/CustomerPortal';
import MyTickets from './pages/MyTickets';
import { AuthProvider, useAuth } from './context/AuthContext';
import RoleRoute from './components/RoleRoute';

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<CustomerPortal />} />
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
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Optional: Add simple dark mode toggle logic
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
          <Navbar />
          <main>
            <AppRoutes />
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

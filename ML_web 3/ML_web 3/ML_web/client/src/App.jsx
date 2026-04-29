import { BrowserRouter, Route, Routes } from "react-router-dom";

import AppLayout from "./components/AppLayout";
import AgentLayout from "./components/AgentLayout";
import Dashboard from "./pages/Dashboard";
import EmployeeDetail from "./pages/EmployeeDetail";
import PerformanceOverview from "./pages/PerformanceOverview";
import Login from "./pages/Login";
import Analytics from "./pages/Analytics";
import TeamManagement from "./pages/TeamManagement";
import GlobalSettings from "./pages/GlobalSettings";
import CustomerChat from "./pages/CustomerChat";
import AgentChat from "./pages/AgentChat";
import AgentStats from "./pages/AgentStats";
import AgentChatHistory from "./pages/AgentChatHistory";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* ===== PUBLIC ROUTES ===== */}
            <Route path="/login" element={<Login />} />
            <Route path="/chat" element={<CustomerChat />} />

            {/* ===== ADMIN ROUTES (role: admin only) ===== */}
            <Route element={
              <ProtectedRoute requiredRole="admin">
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Dashboard />} />
              <Route path="/performance" element={<PerformanceOverview />} />
              <Route path="/employee/:employeeId" element={<EmployeeDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/team" element={<TeamManagement />} />

              <Route path="/settings" element={<GlobalSettings />} />
            </Route>

            {/* ===== AGENT ROUTES (role: agent - support portal) ===== */}
            <Route element={
              <ProtectedRoute requiredRole="agent">
                <AgentLayout />
              </ProtectedRoute>
            }>
              <Route path="/support" element={<AgentChat />} />
              <Route path="/support/history" element={<AgentChatHistory />} />
              <Route path="/support/stats" element={<AgentStats />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

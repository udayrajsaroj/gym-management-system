import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import AttendanceReport from './pages/AttendanceReport'; // 1. Naya page import kiya

// --- AUTO-REDIRECT LOGIC ---
const PublicRoute = ({ children }) => {
  const profileInfo = localStorage.getItem('profile');
  if (profileInfo) {
    const { user } = JSON.parse(profileInfo);
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer-dashboard" replace />;
    return <Navigate to="/member-dashboard" replace />;
  }
  return children;
};

// --- PRIVATE ROUTE PROTECTOR (Optional but recommended) ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const profileInfo = localStorage.getItem('profile');
  if (!profileInfo) return <Navigate to="/" replace />;
  
  const { user } = JSON.parse(profileInfo);
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/" replace />;
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        {/* 2. Naya Attendance Report Route */}
        <Route path="/admin/attendance" element={<AttendanceReport />} />
        
        {/* Other Dashboards */}
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route path="/member-dashboard" element={<MemberDashboard />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
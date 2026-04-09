import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import AttendanceReport from './pages/AttendanceReport';

// --- AUTO-REDIRECT LOGIC (Public Routes) ---
const PublicRoute = ({ children }) => {
  const profileInfo = localStorage.getItem('profile');
  if (profileInfo) {
    // FIX: Destructure directly from parsed object, not from 'user'
    const data = JSON.parse(profileInfo);
    const role = data?.role;

    if (role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (role === 'trainer') return <Navigate to="/trainer-dashboard" replace />;
    if (role === 'member') return <Navigate to="/member-dashboard" replace />;
  }
  return children;
};

// --- PRIVATE ROUTE PROTECTOR ---
const ProtectedRoute = ({ children, allowedRole }) => {
  const profileInfo = localStorage.getItem('profile');
  if (!profileInfo) return <Navigate to="/" replace />;
  
  // FIX: Backend sends data like { role: 'admin', ... }
  const data = JSON.parse(profileInfo);
  const role = data?.role;

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route: Sirf Login ke liye */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Admin Routes (Secure) */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/attendance" 
          element={
            <ProtectedRoute allowedRole="admin">
              <AttendanceReport />
            </ProtectedRoute>
          } 
        />
        
        {/* Trainer Routes (Secure) */}
        <Route 
          path="/trainer-dashboard" 
          element={
            <ProtectedRoute allowedRole="trainer">
              <TrainerDashboard />
            </ProtectedRoute>
          } 
        />

        {/* Member Routes (Secure) */}
        <Route 
          path="/member-dashboard" 
          element={
            <ProtectedRoute allowedRole="member">
              <MemberDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
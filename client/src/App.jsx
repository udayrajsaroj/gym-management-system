import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';

// --- NEW LOGIC: Auto-Redirect if Already Logged In ---
const PublicRoute = ({ children }) => {
  const profileInfo = localStorage.getItem('profile');
  
  // Agar profile localStorage mein hai, toh user ko uske role ke hisaab se redirect kar do
  if (profileInfo) {
    const { user } = JSON.parse(profileInfo);
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user.role === 'trainer') return <Navigate to="/trainer-dashboard" replace />;
    return <Navigate to="/member-dashboard" replace />;
  }
  
  // Agar logged in nahi hai, toh Login page (children) dikhao
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Login page ko PublicRoute ke andar wrap kar diya */}
        <Route 
          path="/" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/trainer-dashboard" element={<TrainerDashboard />} />
        <Route path="/member-dashboard" element={<MemberDashboard />} />
        
        {/* If someone types a wrong URL, go to Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
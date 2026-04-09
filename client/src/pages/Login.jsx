import React, { useState } from 'react';
import { signIn } from '../services/api';
import { useNavigate } from 'react-router-dom'; // window.location se behtar hai

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Navigation hook

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await signIn(formData);
      
      // Pure data ko localstorage mein save karein
      localStorage.setItem('profile', JSON.stringify(data));
      
      console.log("Login Success Data:", data);

      // FIXED: Aapka backend data seedha { role, token... } bhej raha hai
      // Isliye data.user.role ki jagah data.role use karein
      if (data.role === 'admin') {
        navigate('/admin-dashboard');
      } else if (data.role === 'trainer') {
        navigate('/trainer-dashboard');
      } else {
        navigate('/member-dashboard');
      }
      
    } catch (error) {
      console.error("Login Error:", error);
      alert(error.response?.data?.message || "Access Denied: Invalid Credentials");
    } finally {
      // 🚨 Sabse zaroori: loading ko false karein taaki screen freeze na ho
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden">
      {/* Background Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>

      <div className="relative z-10 w-full max-w-md p-8 mx-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              IRON<span className="text-blue-500">PULSE</span>
            </h1>
            <p className="text-slate-400 font-medium">Gym Management System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Email Address
              </label>
              <input 
                type="email" 
                required
                placeholder="name@gym.com"
                className="w-full bg-slate-800/50 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Password
              </label>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="w-full bg-slate-800/50 border border-slate-700 text-white p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-slate-600 uppercase tracking-[3px]">
              © 2026 IronPulse Fitness
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
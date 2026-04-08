import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; 
import AddUserModal from '../components/AddUserModal';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, staff: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false); 
  const [qrToken, setQrToken] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const storedProfile = localStorage.getItem('profile');
      if (!storedProfile) { navigate('/'); return; }
      const token = JSON.parse(storedProfile).token;
      
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(data);
      const active = data.filter(u => u.membershipStatus === 'active' && u.role === 'member').length;
      const expired = data.filter(u => u.membershipStatus === 'expired' && u.role === 'member').length;
      const staff = data.filter(u => u.role === 'admin' || u.role === 'trainer').length;
      setStats({ total: data.length, active, expired, staff });
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshQR = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/gym-token`);
      setQrToken(data.qrValue);
    } catch (err) { console.error("QR Sync Error"); }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let interval;
    if (isQRModalOpen) {
      refreshQR();
      interval = setInterval(refreshQR, 30000); 
    }
    return () => clearInterval(interval);
  }, [isQRModalOpen]);

  // --- FIXED: FETCH MEMBER STATS ---
  const handleViewStats = async (userId, userName) => {
    try {
      const profile = localStorage.getItem('profile');
      if (!profile) return;
      const token = JSON.parse(profile).token;

      // Ensure the URL is exactly as defined in your backend routes
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/member-stats/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`
📊 ATTENDANCE ANALYTICS: ${userName.toUpperCase()}
------------------------------------------
✅ Total Present: ${data.totalPresent} Days
❌ Total Absent: ${data.totalAbsent} Days
📈 Regularity Score: ${data.attendancePercentage}%
📅 Days Since Joined: ${data.totalDaysSinceJoined}
------------------------------------------
      `);
    } catch (err) {
      console.error("Stats API Error:", err.response);
      alert(`Error: ${err.response?.data?.message || "Make sure you have pushed the latest Backend changes to Vercel/Render."}`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => { setEditingUser(null); setIsModalOpen(true); };
  const handleEdit = (user) => { setEditingUser(user); setIsModalOpen(true); };

  const handleDelete = async (id) => {
    if (window.confirm("Permanent Action: Remove this user from the IronPulse database?")) {
      try {
        const token = JSON.parse(localStorage.getItem('profile')).token;
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/delete-user/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
      } catch (error) { alert("Delete failed"); }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
            Iron<span className="text-blue-500">Pulse</span> Admin
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mt-3">Central Management System</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search records..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 md:w-48 bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-xs outline-none focus:border-blue-500 transition-all font-medium"
          />

          <Link 
            to="/admin/attendance"
            className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            Logs
          </Link>

          <button onClick={() => setIsQRModalOpen(true)} className="bg-emerald-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 transition-all">QR Station</button>
          <button onClick={handleAddNew} className="bg-blue-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 shadow-xl transition-all">+ New User</button>
          <button onClick={() => { localStorage.clear(); navigate('/'); }} className="bg-slate-800 text-slate-400 border border-white/5 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">Exit</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Accounts" value={stats.total} color="bg-blue-500" />
        <StatCard title="Active Members" value={stats.active} color="bg-emerald-500" />
        <StatCard title="Expired Plans" value={stats.expired} color="bg-rose-500" />
        <StatCard title="Gym Staff" value={stats.staff} color="bg-amber-500" />
      </div>

      {/* Directory Table */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[2px]">
              <tr>
                <th className="p-6">Identity</th>
                <th className="p-6">Role</th>
                <th className="p-6">Access Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="p-6">
                    <div className="font-black text-sm group-hover:text-blue-400 transition-colors uppercase tracking-tight">{user.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium lowercase italic">{user.email}</div>
                  </td>
                  <td className="p-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${
                      user.role === 'admin' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                      user.role === 'trainer' ? 'text-purple-500 border-purple-500/20 bg-purple-500/5' : 'text-blue-400 border-blue-500/10 bg-blue-500/5'
                    }`}>{user.role}</span>
                  </td>
                  <td className="p-6">
                    {user.role === 'member' ? (
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        user.membershipStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>{user.membershipStatus}</span>
                    ) : <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Staff Account</span>}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      {user.role === 'member' && (
                        <button 
                          onClick={() => handleViewStats(user._id, user.name)}
                          className="p-3 bg-white/5 hover:bg-blue-500 rounded-xl transition-all"
                          title="View Attendance Analytics"
                        >
                          <svg className="w-4 h-4 text-blue-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </button>
                      )}
                      <button onClick={() => handleEdit(user)} className="p-3 bg-white/5 hover:bg-emerald-600 rounded-xl transition-all">
                         <svg className="w-4 h-4 text-emerald-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(user._id)} className="p-3 bg-white/5 hover:bg-rose-600 rounded-xl transition-all">
                         <svg className="w-4 h-4 text-rose-500 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Station Modal */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 flex flex-col items-center">
             <h2 className="text-slate-900 text-2xl font-black uppercase italic mb-2 tracking-tighter">Check-In <span className="text-blue-600">Station</span></h2>
             <div className="bg-slate-50 p-6 rounded-[2rem] border-4 border-slate-100 my-8">
               {qrToken ? <QRCodeSVG value={qrToken} size={240} level="H" /> : <div className="animate-pulse text-slate-300 font-bold uppercase text-[10px]">Initializing...</div>}
             </div>
             <button onClick={() => setIsQRModalOpen(false)} className="bg-slate-900 text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Close Station</button>
          </div>
        </div>
      )}

      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserAdded={fetchData} editingUser={editingUser} />
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-10 blur-3xl transition-all`}></div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mb-4">{title}</p>
    <div className="flex items-end gap-3">
      <h3 className="text-5xl font-black tracking-tighter leading-none">{value}</h3>
      <div className={`w-2 h-2 rounded-full mb-2 animate-pulse ${color}`}></div>
    </div>
  </div>
);

export default AdminDashboard;